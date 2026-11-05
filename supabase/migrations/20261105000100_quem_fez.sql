-- =============================================================================
-- CPR - Guarda o nome de quem fez cada parte
--
-- Como aplicar: rode depois de 20261105000000_schema_inicial.sql, uma única vez.
-- Funciona com ou sem reuniões já gravadas: as existentes ficam com quem_fez nulo.
--
-- Guardamos somente o nome. O nome ligado a uma congregação pode revelar convicção
-- religiosa, dado sensível pela LGPD: o limite de tamanho evita que o campo vire
-- anotação livre, e o RLS já aplicado a tempos_partes continua isolando os dados.
-- =============================================================================

begin;

alter table public.tempos_partes
    add column quem_fez text
    check (quem_fez is null or length(trim(quem_fez)) between 1 and 100);

comment on column public.tempos_partes.quem_fez is
    'Somente o nome de quem fez a parte. Opcional.';

-- Mesma assinatura: as permissões da função são mantidas.
-- p_partes: [{"chave": "discurso", "duracao_segundos": 610, "quem_fez": "Nome"}, ...]
create or replace function public.salvar_reuniao(
    p_tipo_reuniao         public.tipo_reuniao,
    p_data                 date,
    p_hora_inicio          time,
    p_hora_fim             time,
    p_tempo_total_segundos integer,
    p_partes               jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
    v_congregacao_id uuid;
    v_reuniao_id     uuid;
begin
    select id into v_congregacao_id
    from public.congregacoes
    where usuario_id = auth.uid();

    if v_congregacao_id is null then
        raise exception 'Usuário sem congregação' using errcode = '42501';
    end if;

    insert into public.reunioes (
        congregacao_id, tipo_reuniao, data, hora_inicio, hora_fim, tempo_total_segundos
    )
    values (
        v_congregacao_id, p_tipo_reuniao, p_data, p_hora_inicio, p_hora_fim, p_tempo_total_segundos
    )
    returning id into v_reuniao_id;

    insert into public.tempos_partes (
        reuniao_id, tipo_reuniao, parte_chave, duracao_segundos, quem_fez
    )
    select
        v_reuniao_id,
        p_tipo_reuniao,
        parte.chave,
        parte.duracao_segundos,
        nullif(trim(parte.quem_fez), '')
    from jsonb_to_recordset(coalesce(p_partes, '[]'::jsonb))
        as parte (chave text, duracao_segundos integer, quem_fez text);

    return v_reuniao_id;
end;
$$;

-- security_invoker precisa ser repetido: "create or replace" substitui as opções
-- da view, e sem ele o histórico ignoraria o RLS.
create or replace view public.historico_reunioes
with (security_invoker = true) as
select
    r.id,
    r.tipo_reuniao,
    r.data,
    r.hora_inicio,
    r.hora_fim,
    r.tempo_total_segundos,
    coalesce(
        jsonb_agg(
            jsonb_build_object(
                'chave', p.chave,
                'nome', p.nome,
                'secao', p.secao,
                'duracao_segundos', t.duracao_segundos,
                'quem_fez', t.quem_fez
            )
            order by p.ordem
        ) filter (where t.reuniao_id is not null),
        '[]'::jsonb
    ) as partes
from public.reunioes r
left join public.tempos_partes t on t.reuniao_id = r.id
left join public.partes p
    on p.tipo_reuniao = t.tipo_reuniao and p.chave = t.parte_chave
group by r.id;

commit;

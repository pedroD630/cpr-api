-- =============================================================================
-- CPR - Atualizar uma reunião já registrada
--
-- Como aplicar: rode depois das migrations anteriores, uma única vez.
--
-- Substitui os dados da reunião e todos os tempos das partes em uma única
-- transação: ou tudo é atualizado, ou nada muda.
-- p_partes tem o mesmo formato de salvar_reuniao.
--
-- Erros que a API deve tratar:
--   P0002  reunião não encontrada (ou de outra congregação, escondida pelo RLS)
--   23505  já existe outra reunião nessa data e tipo
--   23503  chave de parte inválida para o tipo da reunião
-- =============================================================================

begin;

create function public.atualizar_reuniao(
    p_id                   uuid,
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
begin
    -- Os tempos saem antes: com eles, a troca de tipo esbarraria na chave
    -- estrangeira composta. Se a reunião não for encontrada, a exceção abaixo
    -- desfaz esta exclusão.
    delete from public.tempos_partes where reuniao_id = p_id;

    update public.reunioes
    set tipo_reuniao         = p_tipo_reuniao,
        data                 = p_data,
        hora_inicio          = p_hora_inicio,
        hora_fim             = p_hora_fim,
        tempo_total_segundos = p_tempo_total_segundos
    where id = p_id;

    if not found then
        raise exception 'Reunião não encontrada' using errcode = 'P0002';
    end if;

    insert into public.tempos_partes (
        reuniao_id, tipo_reuniao, parte_chave, duracao_segundos, quem_fez
    )
    select
        p_id,
        p_tipo_reuniao,
        parte.chave,
        parte.duracao_segundos,
        nullif(trim(parte.quem_fez), '')
    from jsonb_to_recordset(coalesce(p_partes, '[]'::jsonb))
        as parte (chave text, duracao_segundos integer, quem_fez text);

    return p_id;
end;
$$;

revoke all on function public.atualizar_reuniao(
    uuid, public.tipo_reuniao, date, time, time, integer, jsonb
) from public, anon;

grant execute on function public.atualizar_reuniao(
    uuid, public.tipo_reuniao, date, time, time, integer, jsonb
) to authenticated, service_role;

commit;

-- =============================================================================
-- CPR - Schema inicial (Supabase / PostgreSQL)
--
-- Como aplicar: cole o arquivo inteiro no SQL Editor do Supabase e execute.
-- Rode uma única vez, em um projeto novo. Tudo roda em uma transação: se algo
-- falhar, nada é criado.
--
-- Modelo:
--   auth.users (Supabase Auth)  1:1  congregacoes   um login por congregação
--   congregacoes                1:N  reunioes       uma por data e tipo
--   reunioes                    1:N  tempos_partes  um tempo por parte
--   partes                                          catálogo fixo das partes
--
-- Só guardamos tempos: nomes de quem fez cada parte e PDFs não vão para o banco.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------

create type public.tipo_reuniao as enum ('mds', 'fds');

-- -----------------------------------------------------------------------------
-- Tabelas
-- -----------------------------------------------------------------------------

create table public.congregacoes (
    id         uuid primary key default gen_random_uuid(),
    usuario_id uuid not null unique references auth.users (id) on delete cascade,
    nome       text not null check (length(trim(nome)) > 0),
    criado_em  timestamptz not null default now()
);

comment on table public.congregacoes is
    'Cada congregação tem exatamente um login (unique em usuario_id).';

-- Catálogo global, somente leitura para os usuários. "chave" é o id do campo no
-- HTML do app e "ordem" é a posição dele na lista .tempo-parte.
create table public.partes (
    tipo_reuniao public.tipo_reuniao not null,
    chave        text not null,
    nome         text not null,
    secao        text,
    ordem        smallint not null,
    primary key (tipo_reuniao, chave),
    unique (tipo_reuniao, ordem)
);

create table public.reunioes (
    id                   uuid primary key default gen_random_uuid(),
    congregacao_id       uuid not null references public.congregacoes (id) on delete cascade,
    tipo_reuniao         public.tipo_reuniao not null,
    data                 date not null,
    hora_inicio          time not null,
    hora_fim             time not null,
    tempo_total_segundos integer not null check (tempo_total_segundos >= 0),
    criado_em            timestamptz not null default now(),
    -- Impede registrar a mesma reunião duas vezes (ex.: reenvio do app) e serve
    -- de índice para a listagem do histórico por congregação e data.
    unique (congregacao_id, data, tipo_reuniao),
    -- Alvo da chave estrangeira composta de tempos_partes.
    unique (id, tipo_reuniao)
);

-- Partes puladas simplesmente não têm linha aqui.
create table public.tempos_partes (
    reuniao_id       uuid not null,
    tipo_reuniao     public.tipo_reuniao not null,
    parte_chave      text not null,
    duracao_segundos integer not null check (duracao_segundos >= 0),
    primary key (reuniao_id, parte_chave),
    foreign key (reuniao_id, tipo_reuniao)
        references public.reunioes (id, tipo_reuniao) on delete cascade,
    -- Junto com a chave acima, garante que a parte pertence ao tipo da reunião.
    foreign key (tipo_reuniao, parte_chave)
        references public.partes (tipo_reuniao, chave)
);

-- -----------------------------------------------------------------------------
-- Catálogo de partes (mesma ordem dos formulários mds.html e fds.html)
-- -----------------------------------------------------------------------------

insert into public.partes (tipo_reuniao, chave, nome, secao, ordem) values
    ('mds', 'comentariosIniciais', 'Comentários Iniciais',           null,                            0),
    ('mds', 'discurso',            'Discurso',                       'Tesouros da Palavra de Deus',   1),
    ('mds', 'encontreJoias',       'Encontre Joias',                 'Tesouros da Palavra de Deus',   2),
    ('mds', 'leituraBiblia',       'Leitura da Bíblia',              'Tesouros da Palavra de Deus',   3),
    ('mds', 'conselho1',           'Conselho - Leitura da Bíblia',   'Tesouros da Palavra de Deus',   4),
    ('mds', 'parte1',              'Parte 1',                        'Faça Seu Melhor no Ministério', 5),
    ('mds', 'conselho2',           'Conselho - Parte 1',             'Faça Seu Melhor no Ministério', 6),
    ('mds', 'parte2',              'Parte 2',                        'Faça Seu Melhor no Ministério', 7),
    ('mds', 'conselho3',           'Conselho - Parte 2',             'Faça Seu Melhor no Ministério', 8),
    ('mds', 'parte3',              'Parte 3',                        'Faça Seu Melhor no Ministério', 9),
    ('mds', 'conselho4',           'Conselho - Parte 3',             'Faça Seu Melhor no Ministério', 10),
    ('mds', 'parte4',              'Parte 4',                        'Faça Seu Melhor no Ministério', 11),
    ('mds', 'conselho5',           'Conselho - Parte 4',             'Faça Seu Melhor no Ministério', 12),
    ('mds', 'NvcParte1',           'Parte 1',                        'Nossa Vida Cristã',             13),
    ('mds', 'NvcParte2',           'Parte 2',                        'Nossa Vida Cristã',             14),
    ('mds', 'NvcParte3',           'Parte 3',                        'Nossa Vida Cristã',             15),
    ('mds', 'estudoBiblico',       'Estudo Bíblico',                 'Nossa Vida Cristã',             16),
    ('mds', 'comentariosFinais',   'Comentários Finais',             null,                            17),
    ('mds', 'anuncios',            'Anúncios',                       null,                            18),
    ('fds', 'comentariosIniciais', 'Comentários Iniciais',           null,                            0),
    ('fds', 'discursoPublico',     'Discurso Público',               null,                            1),
    ('fds', 'estudoSentinela',     'Estudo de A Sentinela',          null,                            2),
    ('fds', 'comentariosFinais',   'Comentários Finais',             null,                            3),
    ('fds', 'anuncios',            'Anúncios',                       null,                            4);

-- -----------------------------------------------------------------------------
-- Cadastro: todo novo login ganha a sua congregação
--
-- No signUp, envie o nome em options.data:
--   supabase.auth.signUp({ email, password,
--     options: { data: { nome_congregacao: 'Congregação Central' } } })
-- -----------------------------------------------------------------------------

create function public.criar_congregacao_do_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.congregacoes (usuario_id, nome)
    values (
        new.id,
        coalesce(
            nullif(trim(new.raw_user_meta_data ->> 'nome_congregacao'), ''),
            'Congregação sem nome'
        )
    );
    return new;
end;
$$;

create trigger ao_criar_usuario
    after insert on auth.users
    for each row execute function public.criar_congregacao_do_usuario();

-- -----------------------------------------------------------------------------
-- Envio da reunião concluída
--
-- Grava a reunião e os tempos em uma única transação: ou entra tudo, ou nada.
-- p_partes: [{"chave": "discurso", "duracao_segundos": 610}, ...]
--
-- Erros que a API deve tratar:
--   23505  reunião já registrada nessa data e tipo (ou parte repetida)
--   23503  chave de parte inválida para o tipo da reunião
-- -----------------------------------------------------------------------------

create function public.salvar_reuniao(
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

    insert into public.tempos_partes (reuniao_id, tipo_reuniao, parte_chave, duracao_segundos)
    select v_reuniao_id, p_tipo_reuniao, parte.chave, parte.duracao_segundos
    from jsonb_to_recordset(coalesce(p_partes, '[]'::jsonb))
        as parte (chave text, duracao_segundos integer);

    return v_reuniao_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Histórico: uma linha por reunião, com as partes em ordem
--
-- security_invoker é obrigatório: sem ele a view ignoraria o RLS e mostraria as
-- reuniões de todas as congregações.
-- -----------------------------------------------------------------------------

create view public.historico_reunioes
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
                'duracao_segundos', t.duracao_segundos
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

-- -----------------------------------------------------------------------------
-- Segurança: RLS isola os dados de cada congregação
-- -----------------------------------------------------------------------------

alter table public.congregacoes  enable row level security;
alter table public.partes        enable row level security;
alter table public.reunioes      enable row level security;
alter table public.tempos_partes enable row level security;

create policy "congregacao ve o proprio cadastro"
    on public.congregacoes for select to authenticated
    using (usuario_id = (select auth.uid()));

create policy "congregacao edita o proprio cadastro"
    on public.congregacoes for update to authenticated
    using (usuario_id = (select auth.uid()))
    with check (usuario_id = (select auth.uid()));

create policy "usuarios leem o catalogo de partes"
    on public.partes for select to authenticated
    using (true);

create policy "congregacao gerencia as proprias reunioes"
    on public.reunioes for all to authenticated
    using (
        congregacao_id in (
            select c.id from public.congregacoes c
            where c.usuario_id = (select auth.uid())
        )
    )
    with check (
        congregacao_id in (
            select c.id from public.congregacoes c
            where c.usuario_id = (select auth.uid())
        )
    );

create policy "congregacao gerencia os proprios tempos"
    on public.tempos_partes for all to authenticated
    using (
        reuniao_id in (
            select r.id
            from public.reunioes r
            join public.congregacoes c on c.id = r.congregacao_id
            where c.usuario_id = (select auth.uid())
        )
    )
    with check (
        reuniao_id in (
            select r.id
            from public.reunioes r
            join public.congregacoes c on c.id = r.congregacao_id
            where c.usuario_id = (select auth.uid())
        )
    );

-- -----------------------------------------------------------------------------
-- Permissões: explícitas para não depender dos padrões do projeto
-- -----------------------------------------------------------------------------

revoke all on
    public.congregacoes,
    public.partes,
    public.reunioes,
    public.tempos_partes,
    public.historico_reunioes
from anon, authenticated;

-- Só o nome é editável: usuario_id não pode ser trocado para tomar outra conta.
grant select on public.congregacoes to authenticated;
grant update (nome) on public.congregacoes to authenticated;

grant select on public.partes to authenticated;
grant select, insert, update, delete on public.reunioes to authenticated;
grant select, insert, update, delete on public.tempos_partes to authenticated;
grant select on public.historico_reunioes to authenticated;

grant all on
    public.congregacoes,
    public.partes,
    public.reunioes,
    public.tempos_partes,
    public.historico_reunioes
to service_role;

revoke all on function public.criar_congregacao_do_usuario()
    from public, anon, authenticated, service_role;

revoke all on function public.salvar_reuniao(
    public.tipo_reuniao, date, time, time, integer, jsonb
) from public, anon;

grant execute on function public.salvar_reuniao(
    public.tipo_reuniao, date, time, time, integer, jsonb
) to authenticated, service_role;

commit;

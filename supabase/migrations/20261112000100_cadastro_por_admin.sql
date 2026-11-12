-- =============================================================================
-- CPR - Cadastro de congregações somente por administradores
--
-- Como aplicar: rode depois das migrations anteriores, uma única vez.
--
-- A chave pública do Supabase é exposta por natureza, então qualquer pessoa
-- consegue chamar o cadastro do Supabase Auth diretamente. Por isso a trava fica
-- no banco: o trigger só cria a conta se um administrador tiver autorizado aquele
-- e-mail nos últimos 10 minutos. Sem autorização, o cadastro falha inteiro.
--
-- O primeiro administrador é autorizado pelo SQL Editor (veja o fim do arquivo).
-- =============================================================================

begin;

alter table public.congregacoes
    add column admin boolean not null default false;

comment on column public.congregacoes.admin is
    'Administradores cadastram congregações. Só muda pelo SQL Editor.';

create table public.cadastros_autorizados (
    email            text primary key check (email = lower(trim(email)) and email like '%_@_%'),
    nome_congregacao text not null check (length(trim(nome_congregacao)) > 0),
    admin            boolean not null default false,
    autorizado_por   uuid default auth.uid() references auth.users (id) on delete set null,
    criado_em        timestamptz not null default now()
);

comment on table public.cadastros_autorizados is
    'Autorizações de cadastro, consumidas pelo trigger ao criar a conta. Valem 10 minutos.';

-- Executa com as permissões de quem chama: o RLS de congregacoes já limita a
-- consulta à congregação do próprio usuário.
create function public.e_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
    select exists (
        select 1 from public.congregacoes
        where usuario_id = (select auth.uid()) and admin
    );
$$;

create or replace function public.criar_congregacao_do_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_autorizacao public.cadastros_autorizados;
begin
    delete from public.cadastros_autorizados
    where email = lower(new.email)
      and criado_em > now() - interval '10 minutes'
    returning * into v_autorizacao;

    if v_autorizacao.email is null then
        raise exception 'Cadastro não autorizado' using errcode = '42501';
    end if;

    insert into public.congregacoes (usuario_id, nome, admin)
    values (new.id, v_autorizacao.nome_congregacao, v_autorizacao.admin);

    return new;
end;
$$;

alter table public.cadastros_autorizados enable row level security;

-- Pelo app, um administrador autoriza apenas congregações comuns.
create policy "admin autoriza cadastros"
    on public.cadastros_autorizados for insert to authenticated
    with check (public.e_admin() and admin = false);

create policy "admin ve autorizacoes"
    on public.cadastros_autorizados for select to authenticated
    using (public.e_admin());

create policy "admin remove autorizacoes"
    on public.cadastros_autorizados for delete to authenticated
    using (public.e_admin());

revoke all on public.cadastros_autorizados from anon, authenticated;
grant select, insert, delete on public.cadastros_autorizados to authenticated;
grant all on public.cadastros_autorizados to service_role;

revoke all on function public.e_admin() from public, anon;
grant execute on function public.e_admin() to authenticated, service_role;

commit;

-- -----------------------------------------------------------------------------
-- Primeiro administrador (rode no SQL Editor e cadastre a conta em seguida):
--
--   insert into public.cadastros_autorizados (email, nome_congregacao, admin)
--   values ('admin@cpr-app.onrender.com', 'Administração', true);
-- -----------------------------------------------------------------------------

# cpr-api

API do app de marcação de tempo das reuniões. Cada congregação tem um login e só acessa os próprios dados.

Requer Node.js 22 ou superior.

## Configuração

1. No SQL Editor do Supabase, rode os arquivos de `supabase/migrations/`, em ordem e uma única vez.
2. Copie `.env.example` para `.env` e preencha as variáveis.
3. Instale e rode localmente, com o `.env`:

```bash
npm install
npm run dev
```

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` | URL do projeto, em Project Settings > API |
| `SUPABASE_PUBLISHABLE_KEY` | Chave pública do projeto (`sb_publishable_...` ou `anon`) |
| `CORS_ORIGIN` | Origens do app separadas por vírgula. Vazio libera qualquer origem: defina em produção |
| `PORT` | Opcional. Padrão: 8000 |

A API não precisa da chave secreta do Supabase. Cada consulta usa o token do usuário logado, e o RLS do banco faz o isolamento entre congregações. Nunca coloque a chave secreta nem o `.env` no Git.

## Deploy no Render

O serviço roda `npm install` e `npm start`, sem arquivo `.env`: cadastre as variáveis acima em **Environment** no painel do serviço.

## Rotas

As rotas marcadas com 🔒 exigem o cabeçalho `Authorization: Bearer <access_token>`.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/cadastro` | Cria o login e a congregação |
| POST | `/api/auth/login` | Entra e devolve a sessão |
| POST | `/api/auth/renovar` | Troca o `refresh_token` por uma nova sessão |
| GET | `/api/congregacao` 🔒 | Dados da congregação logada |
| GET | `/api/reuniao` 🔒 | Histórico, da reunião mais recente para a mais antiga. Filtros opcionais: `?data=2026-11-04` e `?tipo=mds` |
| POST | `/api/reuniao` 🔒 | Registra uma reunião concluída |
| PUT | `/api/reuniao/:id` 🔒 | Substitui os dados e as partes de uma reunião, com o mesmo corpo do POST |
| DELETE | `/api/reuniao/:id` 🔒 | Exclui uma reunião |

### Cadastro e login

```json
{ "email": "congregacao@exemplo.com", "senha": "...", "nome_congregacao": "Central", "aceitou_termos": true }
```

O login usa só `email` e `senha`. A data do aceite dos termos fica nos metadados do usuário, no Supabase Auth. A resposta traz a sessão:

```json
{ "sessao": { "access_token": "...", "refresh_token": "...", "expires_at": 1793980800, "usuario_id": "..." } }
```

No cadastro, quando o projeto exige confirmação de e-mail, `sessao` vem nula e `confirmacao_pendente` vem `true`.

### Registrar reunião

```json
{
  "tipo_reuniao": "mds",
  "data": "2026-11-04",
  "hora_inicio": "19:30",
  "hora_fim": "21:15",
  "tempo_total": "01:45:00",
  "partes": [
    { "chave": "discurso", "tempo": "10:05", "quem_fez": "Nome" },
    { "chave": "anuncios", "tempo": "03:20" }
  ]
}
```

- `chave` é o id do campo no formulário do app. A lista válida fica na tabela `partes`.
- `tempo` aceita `MM:SS` ou `HH:MM:SS`. Parte sem tempo é ignorada.
- `quem_fez` é opcional e guarda somente o nome, com até 100 caracteres.
- A reunião e as partes são gravadas juntas: se algo falhar, nada é salvo.
- Cada congregação pode registrar uma reunião por data e tipo. Um reenvio devolve `409`.

## Erros

Os erros têm o formato `{ "erro": "mensagem" }`.

| Status | Quando acontece |
|---|---|
| 400 | Dados inválidos |
| 401 | Sem login, sessão expirada ou credenciais incorretas |
| 403 | Acesso negado ou e-mail não confirmado |
| 404 | Reunião não encontrada |
| 409 | Reunião ou e-mail já registrado |
| 429 | Muitas tentativas |
| 500 | Erro interno. Os detalhes ficam apenas no log do servidor |

## Testes

```bash
npm test
```

import { isAuthError } from "@supabase/supabase-js";
import { ErroApi } from "../utils/erroApi.js";

const ERROS_BANCO = {
    "23505": [409, "Reunião já registrada nessa data e tipo"],
    "23503": [400, "Parte inválida para esse tipo de reunião"],
    "23514": [400, "Dados fora dos limites permitidos"],
    "22P02": [400, "Dado em formato inválido"],
    "22007": [400, "Data ou hora inválida"],
    "22008": [400, "Data ou hora inválida"],
    "P0002": [404, "Reunião não encontrada"],
    "42501": [403, "Acesso negado"],
    "PGRST301": [401, "Sessão inválida ou expirada"],
    "PGRST303": [401, "Sessão inválida ou expirada"]
};

const ERROS_AUTH = {
    invalid_credentials: [401, "E-mail ou senha inválidos"],
    email_not_confirmed: [403, "Confirme o e-mail antes de entrar"],
    user_already_exists: [409, "E-mail já cadastrado"],
    email_exists: [409, "E-mail já cadastrado"],
    weak_password: [400, "Senha muito fraca"],
    same_password: [400, "A nova senha deve ser diferente da atual"],
    email_address_invalid: [400, "E-mail inválido"],
    // O e-mail padrão do Supabase só envia para a equipe do projeto.
    email_address_not_authorized: [503, "Cadastro indisponível no momento. Fale com o responsável pelo app"],
    signup_disabled: [403, "Cadastro desativado"],
    over_request_rate_limit: [429, "Muitas tentativas. Aguarde e tente novamente"],
    over_email_send_rate_limit: [429, "Muitas tentativas. Aguarde e tente novamente"],
    refresh_token_not_found: [401, "Sessão inválida ou expirada"],
    refresh_token_already_used: [401, "Sessão inválida ou expirada"],
    session_expired: [401, "Sessão inválida ou expirada"],
    session_not_found: [401, "Sessão inválida ou expirada"]
};

function identificarErro(erro) {
    if (erro instanceof ErroApi) return [erro.status, erro.message];
    if (isAuthError(erro)) return ERROS_AUTH[erro.code];
    if (erro.type === "entity.parse.failed") return [400, "JSON inválido"];
    return ERROS_BANCO[erro.code];
}

// Detalhes internos ficam só no log: o cliente recebe mensagens conhecidas.
export function tratarErros(erro, req, res, next) {
    const conhecido = identificarErro(erro);

    if (conhecido) {
        const [status, mensagem] = conhecido;
        return res.status(status).json({ erro: mensagem });
    }

    console.error(erro);
    res.status(500).json({ erro: "Erro interno do servidor" });
}

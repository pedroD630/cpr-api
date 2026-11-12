import { isAuthError } from "@supabase/supabase-js";
import { ErroApi } from "../utils/erroApi.js";
import { criarCliente } from "../utils/supabase.js";
import { loginParaEmail } from "../utils/login.js";

export function formatarSessao(sessao) {
    return {
        access_token: sessao.access_token,
        refresh_token: sessao.refresh_token,
        expires_at: sessao.expires_at,
        usuario_id: sessao.user.id
    };
}

function exigirTexto(valor, mensagem) {
    if (typeof valor !== "string" || !valor) throw new ErroApi(400, mensagem);
    return valor;
}

export async function entrar(req, res) {
    const { login, senha } = req.body ?? {};
    exigirTexto(login, "Informe usuário e senha");
    exigirTexto(senha, "Informe usuário e senha");

    const { data, error } = await criarCliente().auth.signInWithPassword({
        email: loginParaEmail(login),
        password: senha
    });

    if (error?.code === "invalid_credentials") {
        throw new ErroApi(401, "Usuário ou senha inválidos");
    }
    if (error) throw error;

    res.json({ sessao: formatarSessao(data.session) });
}

export async function renovarSessao(req, res) {
    const { refresh_token } = req.body ?? {};
    exigirTexto(refresh_token, "Informe o refresh_token");

    const { data, error } = await criarCliente().auth.refreshSession({ refresh_token });

    // O Supabase usa códigos diferentes para token vencido, reutilizado ou
    // malformado. Para o app, todos significam fazer login de novo.
    if (isAuthError(error) && error.status >= 400 && error.status < 500) {
        throw new ErroApi(401, "Sessão inválida ou expirada");
    }
    if (error) throw error;

    res.json({ sessao: formatarSessao(data.session) });
}

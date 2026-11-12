import { isAuthError } from "@supabase/supabase-js";
import { ErroApi } from "../utils/erroApi.js";
import { criarCliente } from "../utils/supabase.js";
import { loginParaEmail } from "../utils/login.js";

const SENHA_MINIMA = 6;

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

export async function alterarSenha(req, res) {
    const { senha_atual, nova_senha } = req.body ?? {};
    exigirTexto(senha_atual, "Informe a senha atual");
    exigirTexto(nova_senha, "Informe a nova senha");

    if (nova_senha.length < SENHA_MINIMA) {
        throw new ErroApi(400, `A nova senha precisa ter pelo menos ${SENHA_MINIMA} caracteres`);
    }

    // Confirma a senha atual entrando de novo. O cliente guarda essa sessão só na
    // memória desta requisição, e ela é usada para gravar a nova senha.
    const supabase = criarCliente();
    const { error: erroLogin } = await supabase.auth.signInWithPassword({
        email: req.usuario.email,
        password: senha_atual
    });

    // 400 e não 401: a sessão do usuário continua válida, só a senha digitada não.
    if (erroLogin?.code === "invalid_credentials") {
        throw new ErroApi(400, "Senha atual incorreta");
    }
    if (erroLogin) throw erroLogin;

    const { error } = await supabase.auth.updateUser({ password: nova_senha });
    if (error) throw error;

    res.json({ sucesso: true, mensagem: "Senha alterada" });
}

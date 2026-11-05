import { ErroApi } from "../utils/erroApi.js";
import { criarCliente } from "../utils/supabase.js";

function formatarSessao(sessao) {
    return {
        access_token: sessao.access_token,
        refresh_token: sessao.refresh_token,
        expires_at: sessao.expires_at,
        usuario_id: sessao.user.id
    };
}

function exigirCredenciais({ email, senha } = {}) {
    if (typeof email !== "string" || !email || typeof senha !== "string" || !senha) {
        throw new ErroApi(400, "Informe e-mail e senha");
    }
    return { email, password: senha };
}

export async function cadastrar(req, res) {
    const credenciais = exigirCredenciais(req.body);
    const { nome_congregacao, aceitou_termos } = req.body;

    if (typeof nome_congregacao !== "string" || !nome_congregacao.trim()) {
        throw new ErroApi(400, "Informe o nome da congregação");
    }
    if (aceitou_termos !== true) {
        throw new ErroApi(400, "É preciso aceitar os termos de uso");
    }

    const { data, error } = await criarCliente().auth.signUp({
        ...credenciais,
        options: { data: { nome_congregacao, termos_aceitos_em: new Date().toISOString() } }
    });
    if (error) throw error;

    // Sem sessão, o projeto exige confirmar o e-mail antes do primeiro login.
    res.status(201).json({
        confirmacao_pendente: !data.session,
        sessao: data.session ? formatarSessao(data.session) : null
    });
}

export async function entrar(req, res) {
    const { data, error } = await criarCliente().auth.signInWithPassword(exigirCredenciais(req.body));
    if (error) throw error;

    res.json({ sessao: formatarSessao(data.session) });
}

export async function renovarSessao(req, res) {
    const { refresh_token } = req.body ?? {};

    if (typeof refresh_token !== "string" || !refresh_token) {
        throw new ErroApi(400, "Informe o refresh_token");
    }

    const { data, error } = await criarCliente().auth.refreshSession({ refresh_token });
    if (error) throw error;

    res.json({ sessao: formatarSessao(data.session) });
}

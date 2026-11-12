import { ErroApi } from "../utils/erroApi.js";
import { loginParaEmail } from "../utils/login.js";
import { criarCliente } from "../utils/supabase.js";

const SENHA_MINIMA = 6;

export async function getCongregacao(req, res) {
    const { data, error } = await req.supabase
        .from("congregacoes")
        .select("id, nome, admin, criado_em")
        .single();

    if (error) throw error;

    res.json(data);
}

// Só administradores. A autorização é gravada com o token do administrador, então
// o RLS recusa quem não for admin, mesmo que alguém chame a rota diretamente.
export async function cadastrarCongregacao(req, res) {
    const { nome_congregacao, login, senha, aceitou_termos } = req.body ?? {};

    if (typeof nome_congregacao !== "string" || !nome_congregacao.trim()) {
        throw new ErroApi(400, "Informe o nome da congregação");
    }
    if (typeof senha !== "string" || senha.length < SENHA_MINIMA) {
        throw new ErroApi(400, `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres`);
    }
    if (aceitou_termos !== true) {
        throw new ErroApi(400, "Confirme que a congregação aceitou os termos de uso");
    }

    const email = loginParaEmail(login);

    // Remove uma autorização antiga do mesmo e-mail, se houver, e grava a nova.
    const autorizacoes = req.supabase.from("cadastros_autorizados");
    await autorizacoes.delete().eq("email", email);

    const { error: erroAutorizacao } = await req.supabase
        .from("cadastros_autorizados")
        .insert({ email, nome_congregacao: nome_congregacao.trim() });

    if (erroAutorizacao?.code === "42501") {
        throw new ErroApi(403, "Apenas administradores cadastram congregações");
    }
    if (erroAutorizacao) throw erroAutorizacao;

    const { data, error } = await criarCliente().auth.signUp({
        email,
        password: senha,
        options: { data: { termos_aceitos_em: new Date().toISOString() } }
    });

    if (error) {
        // Sem conta criada, a autorização não pode ficar aberta para outra pessoa.
        await req.supabase.from("cadastros_autorizados").delete().eq("email", email);

        if (error.code === "user_already_exists" || error.code === "email_exists") {
            throw new ErroApi(409, "Já existe uma conta com esse usuário ou e-mail");
        }
        throw error;
    }

    res.status(201).json({ sucesso: true, usuario_id: data.user?.id, login: email });
}

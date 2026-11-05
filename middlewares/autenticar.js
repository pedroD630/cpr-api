import { ErroApi } from "../utils/erroApi.js";
import { criarCliente } from "../utils/supabase.js";

// Valida o token e cria o cliente do usuário. Como as consultas usam esse token,
// o RLS do banco garante que cada congregação só acessa os próprios dados.
export async function autenticar(req, res, next) {
    const [esquema, token] = (req.headers.authorization ?? "").split(" ");

    if (esquema !== "Bearer" || !token) {
        throw new ErroApi(401, "Faça login para continuar");
    }

    const supabase = criarCliente(token);
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
        // Falha de conexão não pode virar "sessão expirada" para o usuário.
        if (error.status >= 400 && error.status < 500) {
            throw new ErroApi(401, "Sessão inválida ou expirada");
        }
        throw error;
    }

    req.supabase = supabase;
    req.usuario = data.user;
    next();
}

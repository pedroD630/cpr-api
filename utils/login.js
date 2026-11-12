import { ErroApi } from "./erroApi.js";

// O Supabase Auth exige e-mail. Quem entra só com um nome de usuário (como
// "admin") recebe um e-mail neste domínio, que nunca é usado para envio.
export const DOMINIO_USUARIOS = "cpr-app.onrender.com";

const FORMATO_USUARIO = /^[a-z0-9][a-z0-9._-]{1,29}$/;
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Aceita um nome de usuário ou um e-mail e devolve o e-mail da conta.
export function loginParaEmail(login) {
    const valor = String(login ?? "").trim().toLowerCase();

    if (valor.includes("@")) {
        if (!FORMATO_EMAIL.test(valor)) throw new ErroApi(400, "E-mail inválido");
        return valor;
    }

    if (!FORMATO_USUARIO.test(valor)) {
        throw new ErroApi(400, "Usuário deve ter de 2 a 30 letras, números, ponto, hífen ou sublinhado");
    }

    return `${valor}@${DOMINIO_USUARIOS}`;
}

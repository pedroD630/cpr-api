import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Defina SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY no .env");
}

// Cria um cliente por requisição. Um cliente compartilhado guardaria em memória a
// sessão do último login e poderia usá-la nas consultas de outra congregação.
export function criarCliente(tokenUsuario) {
    return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
            autoRefreshToken: false,
            detectSessionInUrl: false,
            persistSession: false
        },
        global: tokenUsuario
            ? { headers: { Authorization: `Bearer ${tokenUsuario}` } }
            : {}
    });
}

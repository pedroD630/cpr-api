export async function getCongregacao(req, res) {
    const { data, error } = await req.supabase
        .from("congregacoes")
        .select("id, nome, criado_em")
        .single();

    if (error) throw error;

    res.json(data);
}

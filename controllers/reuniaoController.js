import { ErroApi } from "../utils/erroApi.js";
import { validarFiltros, validarReuniao } from "../utils/validarReuniao.js";

export async function getReuniao(req, res) {
    const { data: dataReuniao, tipo } = validarFiltros(req.query);

    let consulta = req.supabase
        .from("historico_reunioes")
        .select("*")
        .order("data", { ascending: false })
        .order("tipo_reuniao");

    if (dataReuniao) consulta = consulta.eq("data", dataReuniao);
    if (tipo) consulta = consulta.eq("tipo_reuniao", tipo);

    const { data, error } = await consulta;
    if (error) throw error;

    res.json(data);
}

export async function inserirReuniao(req, res) {
    const parametros = validarReuniao(req.body);

    const { data: id, error } = await req.supabase.rpc("salvar_reuniao", parametros);
    if (error) throw error;

    res.status(201).json({ sucesso: true, id });
}

export async function atualizarReuniao(req, res) {
    const parametros = validarReuniao(req.body);

    const { error } = await req.supabase.rpc("atualizar_reuniao", {
        p_id: req.params.id,
        ...parametros
    });
    if (error) throw error;

    res.json({ sucesso: true, mensagem: "Reunião atualizada com sucesso" });
}

export async function deletarReuniao(req, res) {
    const { data, error } = await req.supabase
        .from("reunioes")
        .delete()
        .eq("id", req.params.id)
        .select("id");

    if (error) throw error;

    // Reunião de outra congregação também cai aqui: o RLS a esconde.
    if (data.length === 0) {
        throw new ErroApi(404, "Reunião não encontrada");
    }

    res.json({ sucesso: true, mensagem: "Reunião excluída" });
}

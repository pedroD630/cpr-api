import { ObjectId } from "mongodb";

export async function inserirReuniao(req, res, next) {
    try {
        const db = req.server.locals.db;
        const dados = req.body;

        const result = await db.collection("reunioes").insertOne(dados);

        res.json({
            sucesso: true,
            id: result.insertedId
        });
    } catch (error) {
        console.log(error);
    }

}

export async function deletarReuniao(req, res, next) {
    try {
        const db = req.app.locals.db;
        const reuniaoId = req.params.id;

        if (!ObjectId.isValid(reuniaoId)) {
            return res.status(400).json({ erro: "ID inválido" });
        }

        const result = await db.collection("reunioes").deleteOne({_id: new ObjectId(reuniaoId)});

        if(result.deletedCount === 0) {
            return res.status(404).json({ erro: "Reunião não encontrada"});
        }

        return res.json({
            sucesso: true,
            mensagem: "Reunião excluída"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({erro: "Erro interno do servidor"});
    }
}
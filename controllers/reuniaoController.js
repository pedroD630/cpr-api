import { ObjectId } from "mongodb";

export async function inserirReuniao(req, res, next) {
    try {
        const db = req.server.locals.db;
        const dados = req.body;

        const result = await db.collection("reunioes").insertOne(dados);

        res.status(200).json({
            sucesso: true,
            message: "Reunião gravada com sucesso",
            id: result.insertedId
        });
    } catch (error) {
        console.log(error);
    }

}

export async function atualizarReuniao(req, res, next) {
    try {
        const db = req.app.locals.db;
        const reuniaoId = req.params.id;
        const dados = req.body;

        if (!ObjectId.isValid(reuniaoId)) {
            const error = new Error("ID inválido");
            error.status(400);
            return next;
        }

        const result = db.collection("reunioes").updateOne( {_id: new ObjectId(reuniaoId)}, { $set: dados } ) 

        res.status(200).json({
            sucesso: true,
            mensagem: "Reunião atualizada com sucesso",
            result
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({erro: "Erro interno do servidor"});
    }
}

export async function deletarReuniao(req, res, next) {
    try {
        const db = req.app.locals.db;
        const reuniaoId = req.params.id;

        if (!ObjectId.isValid(reuniaoId)) {
            const error = new Error("ID inválido");
            error.status(400);
            return next;
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
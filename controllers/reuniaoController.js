import { ObjectId } from "mongodb";

export async function inserirReuniao(req, res, next) {
    try {
        const db = req.app.locals.db;
        const dados = req.body;

        const result = await db.collection("reunioes").insertOne(dados);

        return res.status(200).json({
            sucesso: true,
            message: "Reunião gravada com sucesso",
            id: result.insertedId
        });

    } catch (error) {
        next(error); // Agora usa o errorHandler
    }
}

export async function atualizarReuniao(req, res, next) {
    try {
        const db = req.app.locals.db;
        const reuniaoId = req.params.id;
        const dados = req.body;

        if (!ObjectId.isValid(reuniaoId)) {
            const error = new Error("ID inválido");
            error.status = 400;
            return next(error);
        }

        const result = await db.collection("reunioes").updateOne(
            { _id: new ObjectId(reuniaoId) },
            { $set: dados }
        );

        return res.status(200).json({
            sucesso: true,
            mensagem: "Reunião atualizada com sucesso",
            result
        });

    } catch (error) {
        next(error);
    }
}

export async function deletarReuniao(req, res, next) {
    try {
        const db = req.app.locals.db;
        const reuniaoId = req.params.id;

        if (!ObjectId.isValid(reuniaoId)) {
            const error = new Error("ID inválido");
            error.status = 400;
            return next(error);
        }

        const result = await db.collection("reunioes").deleteOne({
            _id: new ObjectId(reuniaoId)
        });

        if (result.deletedCount === 0) {
            const error = new Error("Reunião não encontrada");
            error.status = 404;
            return next(error);
        }

        return res.json({
            sucesso: true,
            mensagem: "Reunião excluída"
        });

    } catch (error) {
        next(error);
    }
}
export function inserirReuniao(db) {
    return async (req, res) => {
        const dados = req.body;

        const result = await db.collection("reunioes").insertOne(dados);

        res.json({
            sucesso: true,
            id: result.insertedId
        });
    }

}
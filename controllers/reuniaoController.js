export async function inserirReuniao(req, res, next) {
    try {
        const db = req.app.locals.db;
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
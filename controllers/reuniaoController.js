import {
    connectDB
} from '../utils/database.js'

export async function inserirReuniao(req, res, next) {
    try {
        const db = await connectDB();
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
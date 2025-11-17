import { MongoClient } from "mongodb";

const dbUri = process.env.MONGO_URI;
let db = null;

export async function connectDB(){
    try {
        if (db) return db;

        const client = new MongoClient(dbUri);
        await client.connect();
        return client.db("reunioes");
    }
    catch (error) {
        console.error("Erro ao conectar:", error);
    }
}
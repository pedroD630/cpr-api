import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

export async function connectDB(){
    try {
        await client.connect();
        console.log("COnectado ao mongo db");
        return client.db("reunioes");
    }
    catch (error) {
        console.error("Erro ao conectar:", error);
    }
}
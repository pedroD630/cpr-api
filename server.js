import express from 'express';
import cors from 'cors';
import reuniaoRoutes from './routes/reuniaoRoutes.js';
import { connectDB } from "./utils/database.js";

const server = express();
server.use(cors());

server.use(express.json());
server.use(express.urlencoded({extended: false}));

let db;

server.use('/api/reuniao', reuniaoRoutes(db));

server.listen(8000, async () => {
    db = await connectDB();
    console.log(`Running server on port 8000`);
})
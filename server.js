import express from 'express';
import cors from 'cors';
import reuniaoRoutes from './routes/reuniaoRoutes.js';
import { connectDB } from "./utils/database.js";

const server = express();
server.use(cors());

server.use(express.json());
server.use(express.urlencoded({extended: false}));

server.use('/api/reuniao', reuniaoRoutes);

server.listen(8000, async () => {
    const db = await connectDB();
    server.locals.db = db;  
    console.log(`Running server on port 8000`);
})
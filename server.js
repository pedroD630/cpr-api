import express from 'express';
import cors from 'cors';
import reuniaoRoutes from './routes/reuniaoRoutes.js';
import { connectDB } from "./utils/database.js";

const server = express();
server.use(cors());

server.use(express.json());
server.use(express.urlencoded({extended: true}));

server.use('/api/reuniao', reuniaoRoutes);

const PORT = process.env.PORT || 8000;

server.listen(PORT, async () => {
    const db = await connectDB();
    server.locals.db = db;  
    console.log(`Running server on port ${PORT}`);
})
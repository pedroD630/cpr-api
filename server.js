import express from 'express';
import reuniaoRoutes from './routes/reuniaoRoutes.js';

const server = express();

server.use(express.json());
server.use(express.urlencoded({extended: false}));

server.use('/api/reuniao', reuniaoRoutes);

server.listen(8000, () => {console.log(`Running server on port 8000`);})
import express from 'express';
import {inserirReuniao} from '../controllers/reuniaoController.js';

export default function reunioesRoutes(db) {
    const router = express.Router();

    router.post('/', inserirReuniao(db));
    return router;
}
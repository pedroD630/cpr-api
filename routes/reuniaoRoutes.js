import express from 'express';
import {inserirReuniao} from '../controllers/reuniaoController.js';

const router = express.Router();

router.post('/', inserirReuniao);

export default router;
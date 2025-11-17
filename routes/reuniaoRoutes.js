import express from 'express';
import {inserirReuniao, deletarReuniao} from '../controllers/reuniaoController.js';

const router = express.Router();

router.post('/', inserirReuniao);
router.delete('/:id', deletarReuniao);

export default router;
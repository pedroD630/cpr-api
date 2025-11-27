import express from 'express';
import {inserirReuniao, atualizarReuniao, deletarReuniao} from '../controllers/reuniaoController.js';

const router = express.Router();

router.post('/', inserirReuniao);
router.put('/:id', atualizarReuniao);
router.delete('/:id', deletarReuniao);

export default router;
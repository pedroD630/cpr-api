import express from 'express';
import {getReuniao, inserirReuniao, deletarReuniao} from '../controllers/reuniaoController.js';

const router = express.Router();

router.get('/', getReuniao);
router.post('/', inserirReuniao);
router.delete('/:id', deletarReuniao);

export default router;
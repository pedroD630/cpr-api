import express from 'express';
import {getReuniao, inserirReuniao, atualizarReuniao, deletarReuniao} from '../controllers/reuniaoController.js';
import { autenticar } from '../middlewares/autenticar.js';

const router = express.Router();

router.use(autenticar);

router.get('/', getReuniao);
router.post('/', inserirReuniao);
router.put('/:id', atualizarReuniao);
router.delete('/:id', deletarReuniao);

export default router;

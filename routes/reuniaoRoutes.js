import express from 'express';

const router = express.Router();

router.post('/', inserirReuniao);

export default router;
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import congregacaoRoutes from './routes/congregacaoRoutes.js';
import reuniaoRoutes from './routes/reuniaoRoutes.js';
import { tratarErros } from './middlewares/tratarErros.js';

const app = express();

// Sem CORS_ORIGIN, aceita qualquer origem: defina em produção.
const { CORS_ORIGIN } = process.env;
app.use(cors({ origin: CORS_ORIGIN ? CORS_ORIGIN.split(',') : true }));

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use('/api/auth', authRoutes);
app.use('/api/congregacao', congregacaoRoutes);
app.use('/api/reuniao', reuniaoRoutes);

app.use(tratarErros);

export default app;

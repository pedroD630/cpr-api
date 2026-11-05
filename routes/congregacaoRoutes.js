import express from "express";
import { getCongregacao } from "../controllers/congregacaoController.js";
import { autenticar } from "../middlewares/autenticar.js";

const router = express.Router();

router.use(autenticar);

router.get("/", getCongregacao);

export default router;

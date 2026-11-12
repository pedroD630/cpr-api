import express from "express";
import { cadastrarCongregacao, getCongregacao } from "../controllers/congregacaoController.js";
import { autenticar } from "../middlewares/autenticar.js";

const router = express.Router();

router.use(autenticar);

router.get("/", getCongregacao);
router.post("/", cadastrarCongregacao);

export default router;

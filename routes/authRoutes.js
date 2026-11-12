import express from "express";
import { alterarSenha, entrar, renovarSessao } from "../controllers/authController.js";
import { autenticar } from "../middlewares/autenticar.js";

const router = express.Router();

router.post("/login", entrar);
router.post("/renovar", renovarSessao);
router.put("/senha", autenticar, alterarSenha);

export default router;

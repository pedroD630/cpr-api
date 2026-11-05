import express from "express";
import { cadastrar, entrar, renovarSessao } from "../controllers/authController.js";

const router = express.Router();

router.post("/cadastro", cadastrar);
router.post("/login", entrar);
router.post("/renovar", renovarSessao);

export default router;

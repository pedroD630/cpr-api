import express from "express";
import { entrar, renovarSessao } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", entrar);
router.post("/renovar", renovarSessao);

export default router;

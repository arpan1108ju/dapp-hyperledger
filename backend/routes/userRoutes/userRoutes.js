import express from "express";
import { login } from "../../controllers/user-controllers/login.js";
import { signup } from "../../controllers/user-controllers/signup.js";

const router = express.Router();

router.post('/login',login);
router.post('/signup',signup);

export default router;
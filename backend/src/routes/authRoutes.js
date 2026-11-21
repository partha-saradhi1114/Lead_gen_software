import { Router } from "express";
import { login, getMe, getUsers } from "../controllers/authController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.get("/me", protect, getMe);
router.get("/users", protect, authorize("admin"), getUsers);

export const authRouter = router;

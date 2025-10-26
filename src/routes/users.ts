import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { getById, me, remove, update, changePassword } from "../controllers/userController";

const router = Router();

router.get("/me", requireAuth, me);
router.get("/:id", requireAuth, getById);
router.patch("/me", requireAuth, update);
router.patch("/me/password", requireAuth, changePassword);
router.delete("/me", requireAuth, remove);

export default router;



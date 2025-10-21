import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { getById, me, remove, update } from "../controllers/userController";

const router = Router();

router.get("/me", requireAuth, me);
router.get("/:id", requireAuth, getById);
router.patch("/me", requireAuth, update);
router.delete("/me", requireAuth, remove);

export default router;



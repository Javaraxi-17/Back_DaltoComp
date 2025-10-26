import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { 
  saveColorDetection, 
  saveRecommendations, 
  getColorDetectionHistory, 
  getRecommendationHistory,
  getColorDetectionById,
  deleteColorDetection
} from "../controllers/colorDetectionController";

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(requireAuth);

// Ruta para guardar detección de color
router.post("/save-detection", saveColorDetection);

// Ruta para guardar recomendaciones
router.post("/save-recommendations", saveRecommendations);

// Ruta para obtener historial de detecciones
router.get("/history", getColorDetectionHistory);

// Ruta para obtener historial de recomendaciones
router.get("/recommendations/history", getRecommendationHistory);

// Ruta para obtener una detección específica por ID
router.get("/detection/:id", getColorDetectionById);

// Ruta para eliminar una detección específica
router.delete("/detection/:id", deleteColorDetection);

export default router;

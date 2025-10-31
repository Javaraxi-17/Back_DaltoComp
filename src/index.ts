import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import colorDetectionRoutes from "./routes/colorDetection";
import { adminAuth } from "./services/firebase";

dotenv.config();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "Back_Daltocomp" });
});

app.get("/health/auth", async (_req, res) => {
  try {
    await adminAuth.listUsers(1);
    return res.json({ ok: true, projectId: process.env.FIREBASE_PROJECT_ID });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message ?? String(err) });
  }
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/color-detection", colorDetectionRoutes);

// Middleware global de manejo de errores (DEBE ir al final)
app.use((err: any, req: any, res: any, next: any) => {
  console.error('🚨 Error no controlado en backend:', err);
  
  // Si ya se envió una respuesta, delegar al handler por defecto
  if (res.headersSent) {
    return next(err);
  }
  
  // Manejar diferentes tipos de errores
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      code: 'VALIDATION_ERROR',
      details: err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'No autorizado',
      code: 'UNAUTHORIZED'
    });
  }
  
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'Servicio no disponible',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
  
  // Error genérico del servidor
  return res.status(500).json({
    error: 'Error interno del servidor',
    code: 'INTERNAL_SERVER_ERROR'
  });
});

// Export app for testing
export { app };

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
  app.listen(PORT, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`API escuchando en http://0.0.0.0:${PORT}`);
    console.log(`Acceso local: http://localhost:${PORT}`);
    console.log(`Acceso desde red: http://10.41.41.109:${PORT}`);
  });
}



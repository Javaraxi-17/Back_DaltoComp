import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
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

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`API escuchando en http://0.0.0.0:${PORT}`);
  console.log(`Acceso local: http://localhost:${PORT}`);
  console.log(`Acceso desde red: http://10.41.41.109:${PORT}`);
});



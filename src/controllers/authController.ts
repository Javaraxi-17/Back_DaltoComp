import type { Request, Response } from "express";
import { z } from "zod";
import { adminAuth, firestore, refreshIdToken, signInWithEmailPassword } from "../services/firebase";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function register(req: Request, res: Response) {
  try {
    const { name, email, username, password } = registerSchema.parse(req.body);

    const userRecord = await adminAuth.createUser({ email, password, displayName: name });
    const uid = userRecord.uid;

    await firestore.collection("users").doc(uid).set({
      uid,
      name,
      email,
      username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return res.status(201).json({ uid, email, name, username });
  } catch (err: any) {
    return res.status(400).json({ error: err.message ?? "Register failed" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const { idToken, refreshToken, expiresIn, localId } = await signInWithEmailPassword({ email, password });
    return res.json({ idToken, refreshToken, expiresIn, uid: localId });
  } catch (err: any) {
    return res.status(401).json({ error: err.message ?? "Login failed" });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) return res.status(400).json({ error: "refreshToken requerido" });
    const { id_token, refresh_token, expires_in, user_id } = await refreshIdToken(refreshToken);
    return res.json({ idToken: id_token, refreshToken: refresh_token, expiresIn: expires_in, uid: user_id });
  } catch (err: any) {
    return res.status(401).json({ error: err.message ?? "Refresh failed" });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const { uid } = req.body as { uid?: string };
    if (!uid) return res.status(400).json({ error: "uid requerido" });
    await adminAuth.revokeRefreshTokens(uid);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message ?? "Logout failed" });
  }
}



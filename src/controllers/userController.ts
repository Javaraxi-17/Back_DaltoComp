import type { Response } from "express";
import { z } from "zod";
import { firestore } from "../services/firebase";
import type { AuthedRequest } from "../middlewares/auth";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(3).optional(),
});

export async function me(req: AuthedRequest, res: Response) {
  const uid = req.userId!;
  const snap = await firestore.collection("users").doc(uid).get();
  if (!snap.exists) return res.status(404).json({ error: "Usuario no encontrado" });
  return res.json(snap.data());
}

export async function getById(req: AuthedRequest, res: Response) {
  const { id } = req.params as { id: string };
  const snap = await firestore.collection("users").doc(id).get();
  if (!snap.exists) return res.status(404).json({ error: "Usuario no encontrado" });
  return res.json(snap.data());
}

export async function update(req: AuthedRequest, res: Response) {
  const uid = req.userId!;
  const data = updateSchema.parse(req.body);
  const ref = firestore.collection("users").doc(uid);
  await ref.set({ ...data, updatedAt: new Date().toISOString() }, { merge: true });
  const snap = await ref.get();
  return res.json(snap.data());
}

export async function remove(req: AuthedRequest, res: Response) {
  const uid = req.userId!;
  await firestore.collection("users").doc(uid).delete();
  return res.json({ ok: true });
}



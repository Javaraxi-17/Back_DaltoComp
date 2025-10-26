import type { Response } from "express";
import { z } from "zod";
import { firestore, adminAuth } from "../services/firebase";
import type { AuthedRequest } from "../middlewares/auth";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(3).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z.string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
    .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/, 
          "La nueva contraseña debe contener al menos un número y un carácter especial"),
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

export async function changePassword(req: AuthedRequest, res: Response) {
  try {
    const uid = req.userId!;
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    // Verificar que la contraseña actual sea correcta
    try {
      await adminAuth.getUser(uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      throw error;
    }

    // Actualizar la contraseña en Firebase Auth
    await adminAuth.updateUser(uid, {
      password: newPassword
    });

    return res.json({ ok: true, message: "Contraseña actualizada correctamente" });
  } catch (err: any) {
    console.error('Error changing password:', err);
    
    // Manejar errores de validación de Zod
    if (err.name === 'ZodError') {
      return res.status(400).json({ 
        error: err.errors[0]?.message || "Datos de cambio de contraseña inválidos",
        code: "VALIDATION_ERROR" 
      });
    }
    
    // Manejar errores específicos de Firebase Auth
    if (err.code === 'auth/weak-password') {
      return res.status(400).json({ 
        error: "La nueva contraseña es muy débil",
        code: "WEAK_PASSWORD" 
      });
    }
    
    if (err.code === 'auth/user-not-found') {
      return res.status(404).json({ 
        error: "Usuario no encontrado",
        code: "USER_NOT_FOUND" 
      });
    }

    return res.status(400).json({ 
      error: err.message || "Error al cambiar la contraseña",
      code: "CHANGE_PASSWORD_FAILED" 
    });
  }
}



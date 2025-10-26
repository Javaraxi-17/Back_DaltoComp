import type { Request, Response } from "express";
import { z } from "zod";
import { adminAuth, firestore, refreshIdToken, signInWithEmailPassword } from "../services/firebase";

const registerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("El email debe ser válido"),
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/, 
          "La contraseña debe contener al menos un número y un carácter especial"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function register(req: Request, res: Response) {
  try {
    const { name, email, username, password } = registerSchema.parse(req.body);

    // Verificar si el email ya existe
    try {
      await adminAuth.getUserByEmail(email);
      return res.status(400).json({ 
        error: "El correo electrónico ya está registrado",
        code: "EMAIL_EXISTS" 
      });
    } catch (error: any) {
      // Si no encuentra el usuario, continúa con el registro
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Verificar si el username ya existe
    const usernameQuery = await firestore.collection("users")
      .where("username", "==", username)
      .limit(1)
      .get();
    
    if (!usernameQuery.empty) {
      return res.status(400).json({ 
        error: "El nombre de usuario ya existe",
        code: "USERNAME_EXISTS" 
      });
    }

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
    // Manejar errores de validación de Zod
    if (err.name === 'ZodError') {
      return res.status(400).json({ 
        error: err.errors[0]?.message || "Datos de registro inválidos",
        code: "VALIDATION_ERROR" 
      });
    }
    
    // Manejar errores de Firebase Auth
    if (err.code === 'auth/email-already-exists') {
      return res.status(400).json({ 
        error: "El correo electrónico ya está registrado",
        code: "EMAIL_EXISTS" 
      });
    }
    
    if (err.code === 'auth/weak-password') {
      return res.status(400).json({ 
        error: "La contraseña es muy débil",
        code: "WEAK_PASSWORD" 
      });
    }

    return res.status(400).json({ 
      error: err.message || "Error al crear la cuenta",
      code: "REGISTER_FAILED" 
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const { idToken, refreshToken, expiresIn, localId } = await signInWithEmailPassword({ email, password });
    return res.json({ idToken, refreshToken, expiresIn, uid: localId });
  } catch (err: any) {
    console.error('🔐 Error en login:', err);
    
    // Manejar errores de validación de Zod
    if (err.name === 'ZodError') {
      return res.status(400).json({ 
        error: err.errors[0]?.message || "Datos de login inválidos",
        code: "VALIDATION_ERROR" 
      });
    }
    
    // Manejar errores de red
    if (err.code === 'NETWORK_ERROR' || err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: "No se pudo conectar con el servidor de autenticación",
        code: "NETWORK_ERROR" 
      });
    }
    
    // Manejar errores específicos de Firebase Auth
    if (err.code === 'INVALID_LOGIN_CREDENTIALS' || 
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.message?.includes('INVALID_LOGIN_CREDENTIALS') || 
        err.message?.includes('auth/invalid-credential') ||
        err.message?.includes('auth/user-not-found') ||
        err.message?.includes('auth/wrong-password')) {
      return res.status(401).json({ 
        error: "Credenciales inválidas, contraseña o usuario incorrectos",
        code: "INVALID_CREDENTIALS" 
      });
    }
    
    if (err.code === 'auth/user-disabled' || err.message?.includes('auth/user-disabled')) {
      return res.status(401).json({ 
        error: "La cuenta ha sido deshabilitada",
        code: "USER_DISABLED" 
      });
    }
    
    if (err.code === 'auth/too-many-requests' || err.message?.includes('auth/too-many-requests')) {
      return res.status(429).json({ 
        error: "Demasiados intentos de login. Intenta más tarde",
        code: "TOO_MANY_REQUESTS" 
      });
    }

    // Error genérico de login
    return res.status(401).json({ 
      error: "Credenciales inválidas, contraseña o usuario incorrectos",
      code: "LOGIN_FAILED" 
    });
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



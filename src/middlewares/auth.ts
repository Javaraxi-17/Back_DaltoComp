import type { Request, Response, NextFunction } from "express";
import { adminAuth } from "../services/firebase";

export interface AuthedRequest extends Request {
  userId?: string;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    console.log('🔐 Verificando autenticación...');
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader ? `Presente (${authHeader.substring(0, 20)}...)` : 'Ausente');
    
    if (!authHeader?.startsWith("Bearer ")) {
      console.log('❌ Missing Bearer token');
      return res.status(401).json({ error: "Missing Bearer token", code: "MISSING_BEARER" });
    }
    
    const idToken = authHeader.slice(7).trim();
    if (!idToken) {
      console.log('❌ Empty token');
      return res.status(401).json({ error: "Empty token", code: "EMPTY_TOKEN" });
    }
    
    console.log('🔍 Verificando token con Firebase...');
    console.log('Token recibido:', idToken.substring(0, 20) + '...');
    
    const decoded = await adminAuth.verifyIdToken(idToken);
    console.log('✅ Token válido para usuario:', decoded.uid);
    console.log('Token expira en:', new Date(decoded.exp * 1000).toISOString());
    
    req.userId = decoded.uid;
    return next();
  } catch (err: any) {
    console.log('❌ Error verificando token:', err.message);
    console.log('Código de error:', err.code);
    
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: "Token expirado", code: "TOKEN_EXPIRED" });
    }
    
    if (err.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: "Token inválido", code: "INVALID_TOKEN" });
    }
    
    return res.status(401).json({ error: "Invalid or expired token", code: "AUTH_ERROR" });
  }
}



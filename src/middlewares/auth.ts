import type { Request, Response, NextFunction } from "express";
import { adminAuth } from "../services/firebase";

export interface AuthedRequest extends Request {
  userId?: string;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    console.log('🔐 Verificando autenticación...');
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader ? 'Presente' : 'Ausente');
    
    if (!authHeader?.startsWith("Bearer ")) {
      console.log('❌ Missing Bearer token');
      return res.status(401).json({ error: "Missing Bearer token" });
    }
    
    const idToken = authHeader.slice(7).trim();
    if (!idToken) {
      console.log('❌ Empty token');
      return res.status(401).json({ error: "Empty token" });
    }
    
    console.log('🔍 Verificando token con Firebase...');
    const decoded = await adminAuth.verifyIdToken(idToken);
    console.log('✅ Token válido para usuario:', decoded.uid);
    
    req.userId = decoded.uid;
    return next();
  } catch (err: any) {
    console.log('❌ Error verificando token:', err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}



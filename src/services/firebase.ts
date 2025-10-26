import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_API_KEY,
  FIREBASE_DATABASE_URL,
} = process.env as Record<string, string | undefined>;

function getPrivateKey(): string | undefined {
  if (!FIREBASE_PRIVATE_KEY) return undefined;
  return FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
}

if (!admin.apps.length) {
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error("Faltan variables de entorno Firebase Admin (PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY)");
  }

  const serviceAccount: admin.ServiceAccount = {
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: getPrivateKey()!,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    ...(FIREBASE_DATABASE_URL ? { databaseURL: FIREBASE_DATABASE_URL } : {}),
  } as admin.AppOptions);
}

export const adminAuth = admin.auth();
export const firestore = admin.firestore();

type SignInResponse = {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  email?: string;
};

export async function signInWithEmailPassword(params: {
  email: string;
  password: string;
}): Promise<SignInResponse> {
  if (!FIREBASE_API_KEY) {
    const error = new Error("Falta FIREBASE_API_KEY para login REST");
    (error as any).code = 'MISSING_API_KEY';
    throw error;
  }
  
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...params, returnSecureToken: true }),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({})) as any;
      const error = new Error(errorData.error?.message || `Firebase Auth error: ${res.status}`);
      (error as any).code = errorData.error?.code || 'FIREBASE_AUTH_ERROR';
      (error as any).status = res.status;
      throw error;
    }
    
    return (await res.json()) as SignInResponse;
  } catch (error: any) {
    // Si es un error de red, envolver con información específica
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      const networkError = new Error('No se pudo conectar con el servidor de autenticación');
      (networkError as any).code = 'NETWORK_ERROR';
      throw networkError;
    }
    
    // Re-lanzar el error con su información original
    throw error;
  }
}

export async function refreshIdToken(refreshToken: string): Promise<{
  id_token: string;
  refresh_token: string;
  expires_in: string;
  user_id: string;
}> {
  if (!FIREBASE_API_KEY) {
    throw new Error("Falta FIREBASE_API_KEY para refresh REST");
  }
  const url = `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firebase Refresh error: ${res.status} ${text}`);
  }
  return (await res.json()) as any;
}

export async function revokeUserTokens(uid: string): Promise<void> {
  await adminAuth.revokeRefreshTokens(uid);
}



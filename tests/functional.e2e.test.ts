/// <reference types="jest" />
import { describe, it, expect, jest } from '@jest/globals';
import request from 'supertest';

// Mock Firebase services to avoid real network/credentials
jest.mock('../src/services/firebase', () => {
  const users = new Map<string, any>();

  const adminAuth = {
    getUserByEmail: async (_email: string) => {
      const err: any = new Error('user not found');
      err.code = 'auth/user-not-found';
      throw err;
    },
    createUser: async ({ email }: { email: string }) => {
      const uid = 'uid_' + Math.random().toString(36).slice(2, 10);
      users.set(uid, { uid, email });
      return { uid };
    },
    listUsers: async (_limit: number) => ({ users: [] }),
    verifyIdToken: async (_token: string) => ({ uid: 'test-uid', exp: Math.floor(Date.now() / 1000) + 3600 }),
    revokeRefreshTokens: async (_uid: string) => undefined,
  };

  const makeSnapshot = (docsData: any[]) => ({
    docs: docsData.map((d, i) => ({ id: d.id ?? `doc_${i}`, data: () => d })),
    size: docsData.length,
  });

  const store: Record<string, any[]> = {
    recommendations: [],
    colorDetections: [],
    users: [],
  };

  const collection = (name: string) => {
    const api: any = {
      _filterValue: undefined as any,
      doc: (_id?: string) => ({
        get: async () => ({ exists: false }),
        set: async (_data: any) => undefined,
        delete: async () => undefined,
      }),
      add: async (data: any) => {
        const id = (name === 'recommendations' ? 'rec_' : name === 'colorDetections' ? 'det_' : 'doc_') + Math.random().toString(36).slice(2, 8);
        const payload = { id, ...data };
        (store[name] ||= []).push(payload);
        return { id };
      },
      where: (_field: string, _op: any, value: any) => {
        api._filterValue = value;
        return api;
      },
      orderBy: (_field: string, _dir: any) => api,
      limit: (_n: number) => api,
      startAfter: (_doc: any) => api,
      get: async () => {
        const data = (store[name] || []).filter((d) => (api._filterValue ? d.userId === api._filterValue : true));
        return makeSnapshot(data);
      },
    };
    return api;
  };

  const firestore = { collection } as any;

  const signInWithEmailPassword = async ({ email }: { email: string; password: string }) => ({
    idToken: 'mock-id-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: '3600',
    localId: 'test-uid',
    email,
  });

  const refreshIdToken = async (_refreshToken: string) => ({
    id_token: 'new-id',
    refresh_token: 'new-refresh',
    expires_in: '3600',
    user_id: 'test-uid',
  });

  return { adminAuth, firestore, signInWithEmailPassword, refreshIdToken };
});

import { app } from '../src/index';

describe('Backend Functional E2E', () => {
  const api = request(app);

  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const testUser = {
    name: 'PruebaTest',
    email: `prueba.${unique}@example.com`,
    username: `prueba_${unique}`,
    password: 'Prueb@123!',
  };

  let idToken: string = '';
  let refreshToken: string = '';
  let uid: string = '';

  it('health: should respond OK', async () => {
    const res = await api.get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.service).toBe('Back_Daltocomp');
  });

  it('auth/register: should register a new user (PruebaTest)', async () => {
    const res = await api
      .post('/auth/register')
      .send({
        name: testUser.name,
        email: testUser.email,
        username: testUser.username,
        password: testUser.password,
      });
    expect(res.status).toBe(201);
    expect(res.body.uid).toBeDefined();
    expect(res.body.email).toBe(testUser.email);
    expect(res.body.username).toBe(testUser.username);
    uid = res.body.uid;
  });

  it('auth/login: should login and return idToken', async () => {
    const res = await api
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.status).toBe(200);
    expect(res.body.idToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.uid).toBeDefined();
    idToken = res.body.idToken;
    refreshToken = res.body.refreshToken;
  });

  it('health/auth: should confirm Firebase Admin connectivity', async () => {
    const res = await api.get('/health/auth');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.projectId).toBeDefined();
  });

  it('color-detection/analyze-image: should analyze an image and return analysis', async () => {
    const res = await api
      .post('/color-detection/analyze-image')
      .set('Authorization', `Bearer ${idToken}`)
      .send({
        imageUrl: 'https://example.com/sky.jpg',
        analysisType: 'basic',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.analysis).toBeDefined();
    expect(res.body.analysis.dominantColor).toBeDefined();
    expect(Array.isArray(res.body.analysis.palette)).toBe(true);
  });

  it('color-detection/save-recommendations: should save recommendations', async () => {
    const res = await api
      .post('/color-detection/save-recommendations')
      .set('Authorization', `Bearer ${idToken}`)
      .send({
        colorName: 'Azul Cielo',
        colorCategory: 'Azul',
        recommendations: [
          {
            strategy: 'Alto contraste',
            description: 'Usar combinaciones de alto contraste para mejor legibilidad',
            tips: [
              'Evitar fondo azul con texto azul',
              'Preferir blanco sobre azul para texto',
            ],
          },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.recommendationId).toBeDefined();
  });

  it('color-detection/recommendations/history: should fetch recommendation history', async () => {
    const res = await api
      .get('/color-detection/recommendations/history')
      .set('Authorization', `Bearer ${idToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.recommendationHistory)).toBe(true);
    expect(res.body.recommendationHistory.length).toBeGreaterThan(0);
  });

  it('users/delete: should delete current user', async () => {
    const res = await api
      .delete('/users/me')
      .set('Authorization', `Bearer ${idToken}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('auth/logout: should revoke refresh tokens', async () => {
    if (!uid) {
      // In case uid not captured from register body for any reason, skip gracefully
      return;
    }
    const res = await api
      .post('/auth/logout')
      .send({ uid });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});



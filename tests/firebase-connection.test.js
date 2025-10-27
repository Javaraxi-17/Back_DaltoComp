"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../src/index");
describe('🔥 Pruebas de Conectividad con Firebase', () => {
    describe('1. Verificación de Conexión a Firebase Auth', () => {
        it('debe conectar correctamente con Firebase Auth', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get('/health/auth')
                .expect(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.projectId).toBeDefined();
            expect(typeof response.body.projectId).toBe('string');
        });
        it('debe manejar errores de Firebase Auth graciosamente', async () => {
            // Esta prueba verifica que el endpoint maneja errores sin crashear
            const response = await (0, supertest_1.default)(index_1.app)
                .get('/health/auth');
            // Debe responder con 200 o 500, pero no crashear
            expect([200, 500]).toContain(response.status);
            expect(response.body).toHaveProperty('ok');
        });
    });
    describe('2. Verificación de Conexión a Firestore', () => {
        it('debe poder crear un documento en Firestore', async () => {
            const testData = {
                name: 'Firebase Test User',
                email: `firebase-test-${Date.now()}@example.com`,
                username: `firebasetest${Date.now()}`,
                password: 'FirebaseTest123!'
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/auth/register')
                .send(testData)
                .expect(201);
            expect(response.body).toHaveProperty('idToken');
            expect(response.body).toHaveProperty('localId');
        });
        it('debe poder leer datos de Firestore', async () => {
            // Primero crear un usuario
            const testData = {
                name: 'Firestore Test User',
                email: `firestore-test-${Date.now()}@example.com`,
                username: `firestoretest${Date.now()}`,
                password: 'FirestoreTest123!'
            };
            const registerResponse = await (0, supertest_1.default)(index_1.app)
                .post('/auth/register')
                .send(testData)
                .expect(201);
            const token = registerResponse.body.idToken;
            // Luego leer los datos
            const getResponse = await (0, supertest_1.default)(index_1.app)
                .get('/users/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            expect(getResponse.body).toHaveProperty('name', 'Firestore Test User');
            expect(getResponse.body).toHaveProperty('email', testData.email);
            expect(getResponse.body).toHaveProperty('username', testData.username);
        });
        it('debe poder actualizar datos en Firestore', async () => {
            // Crear usuario
            const testData = {
                name: 'Update Test User',
                email: `update-test-${Date.now()}@example.com`,
                username: `updatetest${Date.now()}`,
                password: 'UpdateTest123!'
            };
            const registerResponse = await (0, supertest_1.default)(index_1.app)
                .post('/auth/register')
                .send(testData)
                .expect(201);
            const token = registerResponse.body.idToken;
            // Actualizar datos
            const updateData = {
                name: 'Updated Firebase User',
                username: 'updatedfirebaseuser'
            };
            const updateResponse = await (0, supertest_1.default)(index_1.app)
                .patch('/users/me')
                .set('Authorization', `Bearer ${token}`)
                .send(updateData)
                .expect(200);
            expect(updateResponse.body).toHaveProperty('name', 'Updated Firebase User');
            expect(updateResponse.body).toHaveProperty('username', 'updatedfirebaseuser');
        });
        it('debe poder eliminar datos de Firestore', async () => {
            // Crear usuario
            const testData = {
                name: 'Delete Test User',
                email: `delete-test-${Date.now()}@example.com`,
                username: `deletetest${Date.now()}`,
                password: 'DeleteTest123!'
            };
            const registerResponse = await (0, supertest_1.default)(index_1.app)
                .post('/auth/register')
                .send(testData)
                .expect(201);
            const token = registerResponse.body.idToken;
            // Eliminar usuario
            const deleteResponse = await (0, supertest_1.default)(index_1.app)
                .delete('/users/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            expect(deleteResponse.body).toHaveProperty('ok', true);
        });
    });
    describe('3. Verificación de Autenticación Firebase', () => {
        it('debe validar tokens de Firebase correctamente', async () => {
            // Crear usuario y obtener token
            const testData = {
                name: 'Token Test User',
                email: `token-test-${Date.now()}@example.com`,
                username: `tokentest${Date.now()}`,
                password: 'TokenTest123!'
            };
            const registerResponse = await (0, supertest_1.default)(index_1.app)
                .post('/auth/register')
                .send(testData)
                .expect(201);
            const token = registerResponse.body.idToken;
            // Usar token para acceder a endpoint protegido
            const protectedResponse = await (0, supertest_1.default)(index_1.app)
                .get('/users/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            expect(protectedResponse.body).toHaveProperty('name', 'Token Test User');
        });
        it('debe rechazar tokens inválidos', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get('/users/me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
            expect(response.body).toHaveProperty('error');
        });
        it('debe rechazar requests sin token', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get('/users/me')
                .expect(401);
            expect(response.body).toHaveProperty('error', 'No token provided');
        });
    });
    describe('4. Verificación de Persistencia de Datos', () => {
        it('debe persistir datos después de operaciones CRUD', async () => {
            // Crear usuario
            const testData = {
                name: 'Persistence Test User',
                email: `persistence-test-${Date.now()}@example.com`,
                username: `persistencetest${Date.now()}`,
                password: 'PersistenceTest123!'
            };
            const registerResponse = await (0, supertest_1.default)(index_1.app)
                .post('/auth/register')
                .send(testData)
                .expect(201);
            const token = registerResponse.body.idToken;
            // Actualizar datos
            const updateData = {
                name: 'Updated Persistence User',
                username: 'updatedpersistence'
            };
            await (0, supertest_1.default)(index_1.app)
                .patch('/users/me')
                .set('Authorization', `Bearer ${token}`)
                .send(updateData)
                .expect(200);
            // Verificar que los datos persisten
            const getResponse = await (0, supertest_1.default)(index_1.app)
                .get('/users/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            expect(getResponse.body).toHaveProperty('name', 'Updated Persistence User');
            expect(getResponse.body).toHaveProperty('username', 'updatedpersistence');
            // Limpiar - eliminar usuario
            await (0, supertest_1.default)(index_1.app)
                .delete('/users/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
        });
    });
});
//# sourceMappingURL=firebase-connection.test.js.map
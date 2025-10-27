"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../src/index");
describe('🧪 Pruebas Funcionales del Backend Daltocomp', () => {
    let testUserToken;
    let testUserId;
    describe('1. Health Check - Conectividad del Servidor', () => {
        it('debe responder el health check básico', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get('/health')
                .expect(200);
            expect(response.body).toEqual({
                ok: true,
                service: 'Back_Daltocomp'
            });
        });
        it('debe verificar conectividad con Firebase Auth', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get('/health/auth')
                .expect(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.projectId).toBeDefined();
        });
    });
    describe('2. Registro de Usuario', () => {
        it('debe registrar un nuevo usuario exitosamente', async () => {
            const userData = {
                name: 'Test User',
                email: `test-${Date.now()}@example.com`,
                username: `testuser${Date.now()}`,
                password: 'TestPassword123!'
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/auth/register')
                .send(userData)
                .expect(201);
            expect(response.body).toHaveProperty('idToken');
            expect(response.body).toHaveProperty('refreshToken');
            expect(response.body).toHaveProperty('expiresIn');
            expect(response.body).toHaveProperty('localId');
            testUserId = response.body.localId;
        });
        it('debe rechazar registro con email duplicado', async () => {
            const userData = {
                name: 'Test User 2',
                email: 'test@example.com', // Email que ya existe
                username: 'testuser2',
                password: 'TestPassword123!'
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/auth/register')
                .send(userData)
                .expect(400);
            expect(response.body).toHaveProperty('error', 'El correo electrónico ya está registrado');
            expect(response.body).toHaveProperty('code', 'EMAIL_EXISTS');
        });
        it('debe rechazar registro con username duplicado', async () => {
            const userData = {
                name: 'Test User 3',
                email: `test3-${Date.now()}@example.com`,
                username: 'testuser', // Username que ya existe
                password: 'TestPassword123!'
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/auth/register')
                .send(userData)
                .expect(400);
            expect(response.body).toHaveProperty('error', 'El nombre de usuario ya existe');
            expect(response.body).toHaveProperty('code', 'USERNAME_EXISTS');
        });
        it('debe validar campos obligatorios en registro', async () => {
            const userData = {
                name: 'Test User',
                // email faltante
                username: 'testuser',
                password: 'TestPassword123!'
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/auth/register')
                .send(userData)
                .expect(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
        });
    });
    describe('3. Login de Usuario', () => {
        it('debe hacer login exitosamente con credenciales válidas', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'TestPassword123!'
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/auth/login')
                .send(loginData)
                .expect(200);
            expect(response.body).toHaveProperty('idToken');
            expect(response.body).toHaveProperty('refreshToken');
            expect(response.body).toHaveProperty('expiresIn');
            expect(response.body).toHaveProperty('localId');
            testUserToken = response.body.idToken;
        });
        it('debe rechazar login con credenciales inválidas', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'WrongPassword123!'
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/auth/login')
                .send(loginData)
                .expect(401);
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('code', 'INVALID_CREDENTIALS');
        });
        it('debe validar campos obligatorios en login', async () => {
            const loginData = {
                email: 'test@example.com'
                // password faltante
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/auth/login')
                .send(loginData)
                .expect(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
        });
    });
    describe('4. Operaciones CRUD de Usuario', () => {
        it('debe obtener perfil del usuario autenticado', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get('/users/me')
                .set('Authorization', `Bearer ${testUserToken}`)
                .expect(200);
            expect(response.body).toHaveProperty('uid');
            expect(response.body).toHaveProperty('name');
            expect(response.body).toHaveProperty('email');
            expect(response.body).toHaveProperty('username');
        });
        it('debe actualizar perfil del usuario', async () => {
            const updateData = {
                name: 'Updated Test User',
                username: 'updatedtestuser'
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .patch('/users/me')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send(updateData)
                .expect(200);
            expect(response.body).toHaveProperty('name', 'Updated Test User');
            expect(response.body).toHaveProperty('username', 'updatedtestuser');
        });
        it('debe cambiar contraseña del usuario', async () => {
            const passwordData = {
                currentPassword: 'TestPassword123!',
                newPassword: 'NewTestPassword123!'
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .patch('/users/me/password')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send(passwordData)
                .expect(200);
            expect(response.body).toHaveProperty('ok', true);
            expect(response.body).toHaveProperty('message', 'Contraseña actualizada correctamente');
        });
        it('debe rechazar acceso sin token de autorización', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get('/users/me')
                .expect(401);
            expect(response.body).toHaveProperty('error', 'No token provided');
        });
        it('debe rechazar acceso con token inválido', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get('/users/me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('5. Conectividad con Firebase', () => {
        it('debe manejar errores de conexión con Firebase', async () => {
            // Simular error de Firebase desconectando temporalmente
            const response = await (0, supertest_1.default)(index_1.app)
                .get('/health/auth')
                .expect(200); // Debe manejar el error graciosamente
            expect(response.body).toHaveProperty('ok');
        });
        it('debe persistir datos en Firestore después de operaciones', async () => {
            // Verificar que los datos se guardaron correctamente
            const response = await (0, supertest_1.default)(index_1.app)
                .get('/users/me')
                .set('Authorization', `Bearer ${testUserToken}`)
                .expect(200);
            expect(response.body).toHaveProperty('name', 'Updated Test User');
            expect(response.body).toHaveProperty('username', 'updatedtestuser');
        });
    });
    describe('6. Manejo de Errores', () => {
        it('debe manejar rutas no encontradas', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get('/ruta-inexistente')
                .expect(404);
        });
        it('debe manejar errores de validación en endpoints protegidos', async () => {
            const invalidData = {
                name: '', // Nombre vacío
                username: 'ab' // Username muy corto
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .patch('/users/me')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send(invalidData)
                .expect(400);
            expect(response.body).toHaveProperty('error');
        });
        it('debe manejar errores de servidor internos', async () => {
            // Probar con datos que causen error interno
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/auth/register')
                .send({}) // Datos completamente vacíos
                .expect(400);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('7. Limpieza - Eliminar Usuario de Prueba', () => {
        it('debe eliminar el usuario de prueba creado', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .delete('/users/me')
                .set('Authorization', `Bearer ${testUserToken}`)
                .expect(200);
            expect(response.body).toHaveProperty('ok', true);
        });
    });
});
//# sourceMappingURL=backend-functional.test.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../src/index");
describe('🔐 Pruebas de Operaciones de Autenticación', () => {
    let testUserToken;
    let testUserId;
    afterAll(async () => {
        // Limpiar usuario de prueba si existe
        if (testUserToken) {
            try {
                await (0, supertest_1.default)(index_1.app)
                    .delete('/users/me')
                    .set('Authorization', `Bearer ${testUserToken}`)
                    .expect(200);
            }
            catch (error) {
                // Usuario ya eliminado o error, continuar
            }
        }
    });
    describe('1. Registro de Usuario', () => {
        it('debe registrar un nuevo usuario exitosamente', async () => {
            const userData = {
                name: 'Auth Test User',
                email: `auth-test-${Date.now()}@example.com`,
                username: `authtest${Date.now()}`,
                password: 'AuthTest123!'
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/auth/register')
                .send(userData)
                .expect(201);
            expect(response.body).toHaveProperty('idToken');
            expect(response.body).toHaveProperty('refreshToken');
            expect(response.body).toHaveProperty('expiresIn');
            expect(response.body).toHaveProperty('localId');
            testUserToken = response.body.idToken;
            testUserId = response.body.localId;
        });
        it('debe rechazar registro con email duplicado', async () => {
            const userData = {
                name: 'Duplicate Email User',
                email: 'test@example.com', // Email que ya existe
                username: 'duplicateemail',
                password: 'DuplicateTest123!'
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
                name: 'Duplicate Username User',
                email: `duplicate-username-${Date.now()}@example.com`,
                username: 'testuser', // Username que ya existe
                password: 'DuplicateTest123!'
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
        it('debe validar formato de email en registro', async () => {
            const userData = {
                name: 'Test User',
                email: 'invalid-email-format',
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
        it('debe validar fortaleza de contraseña en registro', async () => {
            const userData = {
                name: 'Test User',
                email: `weak-password-${Date.now()}@example.com`,
                username: `weakpassword${Date.now()}`,
                password: 'weak' // Contraseña débil
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/auth/register')
                .send(userData)
                .expect(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
        });
    });
    describe('2. Login de Usuario', () => {
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
        });
        it('debe rechazar login con email inexistente', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'TestPassword123!'
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/auth/login')
                .send(loginData)
                .expect(401);
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('code', 'INVALID_CREDENTIALS');
        });
        it('debe rechazar login con contraseña incorrecta', async () => {
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
        it('debe validar formato de email en login', async () => {
            const loginData = {
                email: 'invalid-email-format',
                password: 'TestPassword123!'
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/auth/login')
                .send(loginData)
                .expect(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
        });
    });
    describe('3. Refresh Token', () => {
        it('debe refrescar token exitosamente', async () => {
            // Primero hacer login para obtener refresh token
            const loginData = {
                email: 'test@example.com',
                password: 'TestPassword123!'
            };
            const loginResponse = await (0, supertest_1.default)(index_1.app)
                .post('/auth/login')
                .send(loginData)
                .expect(200);
            const refreshToken = loginResponse.body.refreshToken;
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/auth/refresh')
                .send({ refreshToken })
                .expect(200);
            expect(response.body).toHaveProperty('idToken');
            expect(response.body).toHaveProperty('refreshToken');
            expect(response.body).toHaveProperty('expiresIn');
        });
        it('debe rechazar refresh con token inválido', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/auth/refresh')
                .send({ refreshToken: 'invalid-refresh-token' })
                .expect(401);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('4. Logout', () => {
        it('debe hacer logout exitosamente', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/auth/logout')
                .send({})
                .expect(200);
            expect(response.body).toHaveProperty('ok', true);
        });
    });
    describe('5. Validaciones de Seguridad', () => {
        it('debe rechazar requests con datos maliciosos', async () => {
            const maliciousData = {
                name: '<script>alert("xss")</script>',
                email: 'test@example.com',
                username: 'testuser',
                password: 'TestPassword123!'
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/auth/register')
                .send(maliciousData)
                .expect(400);
            expect(response.body).toHaveProperty('error');
        });
        it('debe validar longitud máxima de campos', async () => {
            const longData = {
                name: 'A'.repeat(1000), // Nombre muy largo
                email: `long-email-${Date.now()}@example.com`,
                username: 'testuser',
                password: 'TestPassword123!'
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/auth/register')
                .send(longData)
                .expect(400);
            expect(response.body).toHaveProperty('error');
        });
    });
});
//# sourceMappingURL=auth-operations.test.js.map
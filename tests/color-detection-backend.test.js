"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../src/index");
const firebase_1 = require("../src/services/firebase");
describe('Color Detection Backend API', () => {
    let authToken;
    let userId;
    beforeAll(async () => {
        // Crear un usuario de prueba y obtener token
        const registerResponse = await (0, supertest_1.default)(index_1.app)
            .post('/auth/register')
            .send({
            name: 'Test User',
            email: 'test@example.com',
            username: 'testuser',
            password: 'Test123!@#'
        });
        if (registerResponse.status === 201) {
            userId = registerResponse.body.uid;
        }
        else {
            // Si el usuario ya existe, hacer login
            const loginResponse = await (0, supertest_1.default)(index_1.app)
                .post('/auth/login')
                .send({
                email: 'test@example.com',
                password: 'Test123!@#'
            });
            authToken = loginResponse.body.idToken;
            userId = loginResponse.body.uid;
        }
        // Obtener token de autenticación
        const loginResponse = await (0, supertest_1.default)(index_1.app)
            .post('/auth/login')
            .send({
            email: 'test@example.com',
            password: 'Test123!@#'
        });
        authToken = loginResponse.body.idToken;
        userId = loginResponse.body.uid;
    });
    afterAll(async () => {
        // Limpiar datos de prueba
        if (userId) {
            try {
                await firebase_1.firestore.collection('colorDetections')
                    .where('userId', '==', userId)
                    .get()
                    .then(snapshot => {
                    const batch = firebase_1.firestore.batch();
                    snapshot.docs.forEach(doc => batch.delete(doc.ref));
                    return batch.commit();
                });
                await firebase_1.firestore.collection('recommendations')
                    .where('userId', '==', userId)
                    .get()
                    .then(snapshot => {
                    const batch = firebase_1.firestore.batch();
                    snapshot.docs.forEach(doc => batch.delete(doc.ref));
                    return batch.commit();
                });
            }
            catch (error) {
                console.error('Error limpiando datos de prueba:', error);
            }
        }
    });
    describe('POST /color-detection/save-detection', () => {
        it('should save color detection data', async () => {
            const colorDetectionData = {
                colorName: 'Rojo Manzana',
                colorCategory: 'Rojo',
                rgb: [255, 59, 48],
                hex: '#FF3B30',
                hsl: [3, 100, 59],
                confidence: 85,
                palette: [
                    {
                        name: 'Rojo Manzana',
                        category: 'Rojo',
                        rgb: [255, 59, 48],
                        percentage: 60
                    },
                    {
                        name: 'Rojo Claro',
                        category: 'Rojo',
                        rgb: [255, 100, 100],
                        percentage: 40
                    }
                ]
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/color-detection/save-detection')
                .set('Authorization', `Bearer ${authToken}`)
                .send(colorDetectionData)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.detectionId).toBeDefined();
            expect(response.body.message).toBe('Detección de color guardada exitosamente');
        });
        it('should return error when data is invalid', async () => {
            const invalidData = {
                colorName: '', // Invalid: empty name
                colorCategory: 'Rojo',
                rgb: [255, 59], // Invalid: only 2 values
                hex: '#FF3B30',
                hsl: [3, 100, 59],
                confidence: 85
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/color-detection/save-detection')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);
            expect(response.body.error).toBeDefined();
            expect(response.body.code).toBe('VALIDATION_ERROR');
        });
        it('should return error when not authenticated', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/color-detection/save-detection')
                .send({})
                .expect(401);
            expect(response.body.error).toBe('Missing Bearer token');
        });
    });
    describe('POST /color-detection/save-recommendations', () => {
        it('should save recommendations data', async () => {
            const recommendationsData = {
                colorName: 'Rojo Manzana',
                colorCategory: 'Rojo',
                recommendations: [
                    {
                        strategy: 'Uso de contexto y patrones',
                        description: 'Identifica el color basándote en su contexto y patrones visuales conocidos.',
                        tips: [
                            'Observa el entorno donde aparece el color',
                            'Busca patrones o formas que te ayuden a identificarlo',
                            'Relaciona el color con objetos familiares'
                        ]
                    },
                    {
                        strategy: 'Comparación con colores conocidos',
                        description: 'Compara el color con otros colores que sí puedes distinguir claramente.',
                        tips: [
                            'Mantén una paleta de colores de referencia',
                            'Usa aplicaciones de identificación de colores',
                            'Pide ayuda a otras personas para confirmar'
                        ]
                    },
                    {
                        strategy: 'Uso de tecnología asistiva',
                        description: 'Aprovecha herramientas tecnológicas diseñadas para personas con daltonismo.',
                        tips: [
                            'Usa aplicaciones de identificación de colores',
                            'Activa filtros de color en tu dispositivo',
                            'Considera usar lentes especializados'
                        ]
                    }
                ]
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/color-detection/save-recommendations')
                .set('Authorization', `Bearer ${authToken}`)
                .send(recommendationsData)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.recommendationId).toBeDefined();
            expect(response.body.message).toBe('Recomendaciones guardadas exitosamente');
        });
        it('should return error when recommendations data is invalid', async () => {
            const invalidData = {
                colorName: 'Rojo Manzana',
                colorCategory: 'Rojo',
                recommendations: [] // Invalid: empty recommendations
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .post('/color-detection/save-recommendations')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);
            expect(response.body.error).toBeDefined();
            expect(response.body.code).toBe('VALIDATION_ERROR');
        });
    });
    describe('GET /color-detection/history', () => {
        it('should get color detection history', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get('/color-detection/history')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.colorHistory).toBeDefined();
            expect(Array.isArray(response.body.colorHistory)).toBe(true);
            expect(response.body.total).toBeDefined();
        });
    });
    describe('GET /color-detection/recommendations/history', () => {
        it('should get recommendation history', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get('/color-detection/recommendations/history')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.recommendationHistory).toBeDefined();
            expect(Array.isArray(response.body.recommendationHistory)).toBe(true);
            expect(response.body.total).toBeDefined();
        });
    });
});
//# sourceMappingURL=color-detection-backend.test.js.map
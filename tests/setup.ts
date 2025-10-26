import { jest } from '@jest/globals';

// Setup básico para pruebas funcionales del backend
// No necesitamos mocks complejos, solo configuración básica

// Configurar variables de entorno para pruebas
process.env.NODE_ENV = 'test';

// Set timeout for tests
jest.setTimeout(30000);
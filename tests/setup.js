"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Setup básico para pruebas funcionales del backend
// No necesitamos mocks complejos, solo configuración básica
// Configurar variables de entorno para pruebas
process.env.NODE_ENV = 'test';
// Set timeout for tests
globals_1.jest.setTimeout(30000);
//# sourceMappingURL=setup.js.map
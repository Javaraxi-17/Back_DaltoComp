module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testMatch: ['**/*.test.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  testTimeout: 30000,
  verbose: true,
  // Configuración para pruebas funcionales
  clearMocks: false,
  restoreMocks: false,
  resetMocks: false,
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        types: ['jest', 'node']
      }
    }]
  },
  testEnvironmentOptions: {
    url: 'http://localhost'
  }
};
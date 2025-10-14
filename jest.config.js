module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/backend'],
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    'backend/**/*.ts',
    '!backend/**/*.spec.ts',
    '!backend/**/*.d.ts',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  maxWorkers: 1,
  testTimeout: 10000,
  forceExit: true,
};

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/modules', '<rootDir>/shared'],
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    'modules/**/*.ts',
    'shared/**/*.ts',
    '!modules/**/*.spec.ts',
    '!shared/**/*.spec.ts',
    '!modules/**/*.d.ts',
    '!shared/**/*.d.ts',
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

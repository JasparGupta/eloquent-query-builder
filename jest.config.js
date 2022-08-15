/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  globals: {
    'ts-jest': {
      tsconfig: {
        noEmitOnError: true,
      }
    }
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
};
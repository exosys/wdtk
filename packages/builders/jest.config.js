module.exports = {
  bail: true,
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/tsconfig.spec.json',
      useExperimentalLanguageServer: true
    }
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '.*spec.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transformIgnorePatterns: ['/node_modules/'],
  modulePathIgnorePatterns: ['/node_modules/', '/files/'],
  projects: ['<rootDir>'],
  collectCoverageFrom: ['./src/**/*.ts'],
  coveragePathIgnorePatterns: ['.*(spec|const|config|mock|module|public-api|index|mock|model).ts'],
  coverageReporters: ['lcovonly', 'html'],
  cacheDirectory: '<rootDir>/.cache/unit'
};

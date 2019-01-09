module.exports = {
  name: 'www',
  globals: {
    'ts-test': {
      tsConfigFile: './tsconfig.spec.json'
    },
    __TRANSFORM_HTML__: true
  },
  transform: {
    '^.+\\.(ts|js|html)$': '<rootDir>/../../../node_modules/jest-preset-angular/preprocessor.js'
  },
  testMatch: ['**/__tests__/**/*.+(ts|js)?(x)', '**/+(*.)+(spec|test).+(ts|js)?(x)'],
  moduleFileExtensions: ['ts', 'js', 'html', 'json'],
  moduleNameMapper: {
    '^src/(.*)': '<rootDir>/src/$1',
    '^app/(.*)': '<rootDir>/src/app/$1',
    '^assets/(.*)': '<rootDir>/src/assets/$1',
    '^environments/(.*)': '<rootDir>/src/environments/$1'
  },
  transformIgnorePatterns: ['node_modules/(?!@ngrx)'],
  snapshotSerializers: [
    '<rootDir>/../../../node_modules/jest-preset-angular/AngularSnapshotSerializer.js',
    '<rootDir>/../../../node_modules/jest-preset-angular/HTMLCommentSerializer.js'
  ]
};

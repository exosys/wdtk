module.exports = {
  name: '<%= project %>',
  <% if(projectType==='application') { %>
  verbose:true,  
  <% } %>
  globals: {
    'ts-test': {
      tsConfigFile: './tsconfig.spec.json'
    },
    __TRANSFORM_HTML__: true
  },
  transform: {
    '^.+\\.(ts|js|html)$': '<rootDir>/<%= relativePathToWorkspaceRoot %>/node_modules/jest-preset-angular/preprocessor.js'
  },
  testMatch: ['**/__tests__/**/*.+(ts|js)?(x)', '**/+(*.)+(spec|test).+(ts|js)?(x)'],
  moduleFileExtensions: ['ts', 'js', 'html', 'json'],
  moduleNameMapper: {
    '^src/(.*)': '<rootDir>/src/$1',<% if(projectType==='application') { %> 
    '^app/(.*)': '<rootDir>/src/app/$1',
    '^assets/(.*)': '<rootDir>/src/assets/$1',
    '^environments/(.*)': '<rootDir>/src/environments/$1'
    <% } else { %> 
    '^lib/(.*)': '<rootDir>/src/lib/$1'
    <% } %>
  },
  transformIgnorePatterns: ['node_modules/(?!@ngrx)'],
  snapshotSerializers: [
    '<rootDir>/<%= relativePathToWorkspaceRoot %>/node_modules/jest-preset-angular/AngularSnapshotSerializer.js',
    '<rootDir>/<%= relativePathToWorkspaceRoot %>/node_modules/jest-preset-angular/HTMLCommentSerializer.js'
  ]
};

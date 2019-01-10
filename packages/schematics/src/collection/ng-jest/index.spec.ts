import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '../workspace/schema';
import { Schema as ProjectOptions } from './schema';
import * as ng from './../../angular';

describe('ng-jest', () => {
  const schematicRunner = new SchematicTestRunner('@wdtk/schematics', require.resolve('../../../collection.json'));
  let workspaceTree: UnitTestTree;
  let projectTree: UnitTestTree;

  const workspaceOpts: WorkspaceOptions = {
    name: 'bar',
    newPackageRoot: 'pkg'
  };

  const projectOpts: ProjectOptions = {
    project: 'foo',
    skipSetupFile: false
  };
  const projectName = '@bar/foo';
  const projectRoot = 'pkg/lib/foo';

  beforeEach(() => {
    workspaceTree = schematicRunner.runSchematic('workspace', workspaceOpts);
    projectTree = schematicRunner.runSchematic('ng-lib', { name: 'foo', unitTestRunner: 'none' }, workspaceTree);
    projectTree = schematicRunner.runSchematic('ng-jest', { project: '@bar/foo' }, projectTree);
  });
  it('should generate jest config file', () => {
    expect(projectTree.files).toContain(`/${projectRoot}/jest.config.js`);
  });

  it('should generate correct jest configuration values', () => {
    let actual = projectTree.readContent(`${projectRoot}/jest.config.js`);
    actual = actual.replace(/\s+/g, ' ');
    let expected = `module.exports = { name: '${projectName}', preset: '../../../jest.config.js', coverageDirectory: '../../../target/test/coverage' };`;
    expected = expected.replace(/\s+/g, ' ');
    expect(actual).toBe(expected);
  });
  it('should remove karma config file', () => {
    expect(projectTree.files).not.toContain(`${projectRoot}/karma.conf.js`);
  });

  it('should update angular architect test configuration', () => {
    const project = ng.getProject(projectName, projectTree);
    expect((<any>project).architect).toBeDefined();
    expect((<any>project).architect.test).toBeDefined();
    expect((<any>project).architect.test.builder).toEqual('@wdtk/builders:jest');
  });

  it('should update the tsconfig.spec.json', () => {
    const spec = JSON.parse(projectTree.readContent(`${projectRoot}/tsconfig.spec.json`));
    expect(spec.compilerOptions.types).toContain('node');
    expect(spec.compilerOptions.types).toContain('jest');
    expect(spec.compilerOptions.types).not.toContain('jasmine');
  });

  it('should update the test.ts', () => {
    const text = projectTree.readContent(`${projectRoot}/src/test.ts`);
    const t = text;
    // expect(false).toEqual(true);
  });
});

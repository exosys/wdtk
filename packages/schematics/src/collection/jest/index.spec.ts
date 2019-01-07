import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '../workspace/schema';
import { TaskConfiguration } from '@angular-devkit/schematics';
describe('Jest Workspace Schematic', () => {
  let workspaceTree: UnitTestTree;
  const schematicRunner = new SchematicTestRunner('@wdtk/schematics', require.resolve('../../../collection.json'));

  const workspaceOpts: WorkspaceOptions = {
    name: 'bar',
    newPackageRoot: 'pkg'
  };
  beforeEach(() => {
    workspaceTree = schematicRunner.runSchematic('workspace', workspaceOpts);
  });

  it('should generate workspace jest configuration', () => {
    workspaceTree = schematicRunner.runSchematic('jest', { skipInstall: true }, workspaceTree);
    expect(workspaceTree.files).toContain('/jest.config.js');
  });
  it('should add required dependencies to root package', () => {
    workspaceTree = schematicRunner.runSchematic('jest', { skipInstall: true }, workspaceTree);
    const rootPackage = JSON.parse(workspaceTree.readContent('/package.json'));
    const devDependencies = rootPackage.devDependencies;
    expect(devDependencies['jest']).toBeDefined();
    expect(devDependencies['@types/jest']).toBeDefined();
  });

  
  it('should not skip installation of dependencies when invoked without --skip-install', () => {
    workspaceTree = schematicRunner.runSchematic('jest', {}, workspaceTree);
    const tasks: TaskConfiguration[] = schematicRunner.tasks;
    let installTaskFound = false;

    tasks.forEach((task: TaskConfiguration) => {
      if (task.name === 'node-package') {
        if (task.options && (<any>task.options).command === 'install') {
          installTaskFound = true;
        }
      }
    });
    expect(installTaskFound).toBeTruthy();
  });

  it('should not skip installation of dependencies when invoked with --skip-install set to false', () => {
    workspaceTree = schematicRunner.runSchematic('jest', {skipInstall:false}, workspaceTree);
    const tasks: TaskConfiguration[] = schematicRunner.tasks;
    let installTaskFound = false;

    tasks.forEach((task: TaskConfiguration) => {
      if (task.name === 'node-package') {
        if (task.options && (<any>task.options).command === 'install') {
          installTaskFound = true;
        }
      }
    });
    expect(installTaskFound).toBeTruthy();
  });

  it('should skip installation of dependencies when invoked with --skip-install', () => {
    workspaceTree = schematicRunner.runSchematic('jest', {skipInstall:true}, workspaceTree);
    const tasks: TaskConfiguration[] = schematicRunner.tasks;
    let installTaskFound = false;

    tasks.forEach((task: TaskConfiguration) => {
      if (task.name === 'node-package') {
        if (task.options && (<any>task.options).command === 'install') {
          installTaskFound = true;
        }
      }
    });
    expect(installTaskFound).toBeFalsy();
  });
});

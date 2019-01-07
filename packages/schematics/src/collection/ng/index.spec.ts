import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '../workspace/schema';

describe('Angular Workspace Schematic', () => {
  const workspaceOpts: WorkspaceOptions = {
    name: 'bar',
    newPackageRoot: 'pkg'
  };

  let workspaceTree: UnitTestTree;
  const schematicRunner = new SchematicTestRunner('@wdtk/schematics', require.resolve('../../../collection.json'));
  beforeEach(() => {
    workspaceTree = schematicRunner.runSchematic('workspace', workspaceOpts);
  });
  it('should generate workspace angular configuration', () => {
    workspaceTree = schematicRunner.runSchematic('ng', { packagesRoot: workspaceOpts.newPackageRoot, skipInstall: true }, workspaceTree);
    expect(workspaceTree.files).toContain('/angular.json');
  });
});

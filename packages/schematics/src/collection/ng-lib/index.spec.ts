import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '../workspace/schema';
import { Schema as LibraryOptions } from './schema';
import { getFileContent } from '@schematics/angular/utility/test';
describe('ng-library schematic', () => {
  const schematicRunner = new SchematicTestRunner('@wdtk/schematics', require.resolve('../../../collection.json'));

  const defaultLibraryOptions: LibraryOptions = {
    name: 'foo'
    // skipInstall: true
  };

  const workspaceOptions: WorkspaceOptions = {
    name: 'bar',
    newPackageRoot: 'pkg'
  };

  let workspaceTree: UnitTestTree;
  beforeEach(() => {
    workspaceTree = schematicRunner.runSchematic('workspace', workspaceOptions);
  });

  it('should create a package in the lib directory', () => {
    const rootPkg = JSON.parse(workspaceTree.readContent('/package.json'));
    const newPackageRoot = rootPkg.wx.newPackageRoot;
    const libPackageRoot = rootPkg.wx.libPackageRoot;

    const tree = schematicRunner.runSchematic('ng-lib', defaultLibraryOptions, workspaceTree);
    const files = tree.files;
    expect(files).toContain(`/${newPackageRoot}/${libPackageRoot}/${defaultLibraryOptions.name}/package.json`);
  });
  it('should create a library scoped by default to the workspace name', () => {
    const tree = schematicRunner.runSchematic('ng-lib', defaultLibraryOptions, workspaceTree);

    const rootPkg = JSON.parse(workspaceTree.readContent('/package.json'));
    const scopeName = rootPkg.name;
    const newPackageRoot = rootPkg.wx.newPackageRoot;
    const libPackageRoot = rootPkg.wx.libPackageRoot;

    const libPkg = JSON.parse(tree.readContent(`/${newPackageRoot}/${libPackageRoot}/${defaultLibraryOptions.name}/package.json`));
    expect(libPkg.name).toEqual(`@${scopeName}/${defaultLibraryOptions.name}`);
  });
});

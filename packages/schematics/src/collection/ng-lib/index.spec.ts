import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '../workspace/schema';
import { Schema as LibraryOptions } from './schema';
import { getFileContent } from '@schematics/angular/utility/test';

function getJsonFileContent(projectName: string, relativePath: string, tree: UnitTestTree): any {
  const rootPkg = JSON.parse(tree.readContent('/package.json'));
  const newPackageRoot = rootPkg.wx.newPackageRoot;
  const libPackageRoot = rootPkg.wx.libPackageRoot;
  const path = `/${newPackageRoot}/${libPackageRoot}/${projectName}/${relativePath}`;
  const json = JSON.parse(tree.readContent(path));
  return json;
}

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

    const libPkg = getJsonFileContent(defaultLibraryOptions.name, 'package.json', tree);
    expect(libPkg.name).toEqual(`@${scopeName}/${defaultLibraryOptions.name}`);
  });

  it('should update angular workspace config with the name using workspace default scope name', () => {
    const tree = schematicRunner.runSchematic('ng-lib', defaultLibraryOptions, workspaceTree);
    const angularConfig = JSON.parse(tree.readContent('/angular.json'));
    expect(angularConfig.projects[defaultLibraryOptions.name]).toBeDefined();
  });

  it('should update angular workspace config with name when provided scope does not match the workspace scope', () => {
    const opts = { ...defaultLibraryOptions, name: `@scope/${defaultLibraryOptions.name}` };
    const tree = schematicRunner.runSchematic('ng-lib', opts, workspaceTree);
    const angularConfig = JSON.parse(tree.readContent('/angular.json'));
    expect(angularConfig.projects[`@scope/${defaultLibraryOptions.name}`]).toBeDefined();
  });

  it('should set the right path in the tsconfig file', () => {
    const tree = schematicRunner.runSchematic('ng-lib', defaultLibraryOptions, workspaceTree);
    const tsconfig = getJsonFileContent(defaultLibraryOptions.name, 'tsconfig.lib.json', tree);
    expect(tsconfig.extends).toMatch('../../../tsconfig.json');
  });

  it('should add the dist directory to root tsconfig.paths so that tsc can resolve it', () => {
    const tree = schematicRunner.runSchematic('ng-lib', defaultLibraryOptions, workspaceTree);
    const rootTsConfig = JSON.parse(tree.readContent('/tsconfig.json'));
    const rootPkg = JSON.parse(tree.readContent('/package.json'));
    const scopeName = rootPkg.name;
    const newPackageRoot = rootPkg.wx.newPackageRoot;
    const libPackageRoot = rootPkg.wx.libPackageRoot;
    const libProjectRoot = `${newPackageRoot}/${libPackageRoot}/${defaultLibraryOptions.name}`;

    expect(rootTsConfig.compilerOptions.paths).toBeDefined();
    expect(rootTsConfig.compilerOptions.paths[`@${scopeName}/${defaultLibraryOptions.name}`]).toContain(`${libProjectRoot}/src/index.ts`);
  });
});

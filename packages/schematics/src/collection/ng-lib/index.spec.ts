import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '../workspace/schema';
import { Schema as LibraryOptions } from './schema';
import * as ng from './../../angular';

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
    name: 'foo',
    skipInstall: true
  };

  const workspaceOptions: WorkspaceOptions = {
    name: 'bar',
    newPackageRoot: 'pkg'
  };

  let workspaceTree: UnitTestTree;
  beforeEach(() => {
    workspaceTree = schematicRunner.runSchematic('workspace', workspaceOptions);
  });

  it("should create a package in the 'lib' directory by default", () => {
    const tree = schematicRunner.runSchematic('ng-lib', defaultLibraryOptions, workspaceTree);
    const files = tree.files;
    expect(files).toContain('/pkg/lib/foo/ng-package.json');
  });

  it('should update the angular workspace configuration', () => {
    const tree = schematicRunner.runSchematic('ng-lib', defaultLibraryOptions, workspaceTree);
    const project = ng.getProject('@bar/foo', tree);
    expect(project.root).toEqual('pkg/lib/foo');
    expect(project.sourceRoot).toEqual('pkg/lib/foo/src');
    if (project.architect) {
      if (project.architect.build) {
        expect(project.architect.build.options.tsConfig).toEqual('pkg/lib/foo/tsconfig.lib.json');
        expect((<any>project.architect.build.options).project).toEqual('pkg/lib/foo/ng-package.json');
      }
      if (project.architect.test) {
        expect(project.architect.test.options.main).toEqual('pkg/lib/foo/src/test.ts');
        expect(project.architect.test.options.tsConfig).toEqual('pkg/lib/foo/tsconfig.spec.json');
        expect(project.architect.test.options.karmaConfig).toEqual('pkg/lib/foo/karma.conf.js');
      }
      if (project.architect.lint) {
        expect(project.architect.lint.options.tsConfig).toEqual(
          expect.arrayContaining(['pkg/lib/foo/tsconfig.lib.json', 'pkg/lib/foo/tsconfig.spec.json'])
        );
      }
    }
  });
  it('should update the ts configuration files with the correct relative path to the workspace root', () => {
    const tree = schematicRunner.runSchematic('ng-lib', defaultLibraryOptions, workspaceTree);
    let tsconfig = getJsonFileContent(defaultLibraryOptions.name, 'tsconfig.lib.json', tree);
    expect(tsconfig.extends).toMatch('../../../tsconfig.json');

    tsconfig = getJsonFileContent(defaultLibraryOptions.name, 'tsconfig.spec.json', tree);
    expect(tsconfig.extends).toMatch('../../../tsconfig.json');
  });

  it('should update the tslint configuration files with the correct relative path to the workspace root', () => {
    const tree = schematicRunner.runSchematic('ng-lib', defaultLibraryOptions, workspaceTree);
    let tsconfig = getJsonFileContent(defaultLibraryOptions.name, 'tslint.json', tree);
    expect(tsconfig.extends).toMatch('../../../tslint.json');
  });

  it('should add the dist directory to root tsconfig paths property so that tsc can resolve the library', () => {});

  it('should by default set the prefix to the scope name when prefix is not provided', () => {
    const tree: UnitTestTree = schematicRunner.runSchematic('ng-lib', defaultLibraryOptions, workspaceTree);
    const project = ng.getProject('@bar/foo', tree);
    expect(project.prefix).toEqual('bar');
  });

  it('should set the prefix to the provided value', () => {
    const tree: UnitTestTree = schematicRunner.runSchematic('ng-lib', { name: 'foo', prefix: 'prefix' }, workspaceTree);
    const project = ng.getProject('@bar/foo', tree);
    expect(project.prefix).toEqual('prefix');
  });

  it('should scope a new library to the workspace name', () => {
    const tree: UnitTestTree = schematicRunner.runSchematic('ng-lib', defaultLibraryOptions, workspaceTree);
    const appPkg = JSON.parse(tree.readContent('/pkg/lib/foo/package.json'));
    expect(appPkg.name).toEqual('@bar/foo');
  });

  it('should scope a new library to the workspace name', () => {
    const tree: UnitTestTree = schematicRunner.runSchematic('ng-lib', defaultLibraryOptions, workspaceTree);
    const appPkg = JSON.parse(tree.readContent('/pkg/lib/foo/package.json'));
    expect(appPkg.name).toEqual('@bar/foo');
  });

  it('should use the scope provided in the library name', () => {
    const tree: UnitTestTree = schematicRunner.runSchematic('ng-lib', { name: '@notbar/foo' }, workspaceTree);
    const appPkg = JSON.parse(tree.readContent('/pkg/lib/foo/package.json'));
    expect(appPkg.name).toEqual('@notbar/foo');
  });

  it('should not set angular defaultProject configuration value', () => {
    const tree: UnitTestTree = schematicRunner.runSchematic('ng-lib', { name: '@notbar/foo' }, workspaceTree);
    const ngWorkspaceConfig = ng.getWorkspaceConfig(tree);
    expect(ngWorkspaceConfig.defaultProject).toBeUndefined();
  });
});

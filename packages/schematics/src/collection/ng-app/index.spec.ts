import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';
import * as ng from './../../angular';
describe('Angular Application Schematic', () => {
  const workspaceOpts: WorkspaceOptions = {
    name: 'bar',
    newProjectRoot: 'pkg',
    version: '7.0.0'
  };

  const defaultApplicationOpts: ApplicationOptions = {
    name: 'foo',
    inlineStyle: false,
    inlineTemplate: false,
    routing: false,
    skipPackageJson: false
  };
  const schematicRunner = new SchematicTestRunner('@wdtk/schematics', require.resolve('../../../collection.json'));
  let workspaceTree: UnitTestTree;
  beforeEach(() => {
    workspaceTree = schematicRunner.runSchematic('workspace', workspaceOpts);
  });

  it("should create new application in the 'app' dir", () => {
    const tree: UnitTestTree = schematicRunner.runSchematic('ng-app', { name: 'foo' }, workspaceTree);
    const files = tree.files;
    expect(files).toContain(`/pkg/app/foo/src/main.ts`);
  });

  it('should by default set the prefix to the scope name ', () => {
    const tree: UnitTestTree = schematicRunner.runSchematic('ng-app', { name: 'foo' }, workspaceTree);
    const project = ng.getProject('foo', tree);
    expect(project.prefix).toEqual('bar');
  });

  it('should set the prefix to the provided value', () => {
    const tree: UnitTestTree = schematicRunner.runSchematic('ng-app', { name: 'foo', prefix: 'prefix' }, workspaceTree);
    const project = ng.getProject('foo', tree);
    expect(project.prefix).toEqual('prefix');
  });

  it("should create the e2e directory in the application's root directory", () => {
    const tree: UnitTestTree = schematicRunner.runSchematic('ng-app', defaultApplicationOpts, workspaceTree);
    const files = tree.files;
    expect(files).toContain('/pkg/app/foo/e2e/tsconfig.e2e.json');
  });

  it('should update the angular e2e project configuration with corrected paths', () => {
    const tree: UnitTestTree = schematicRunner.runSchematic('ng-app', defaultApplicationOpts, workspaceTree);
    const projectName = 'foo-e2e';
    const project = ng.getProject(projectName, tree);
    expect(project.root).toEqual('pkg/app/foo/e2e');
    expect(project.sourceRoot).toEqual('pkg/app/foo/e2e/src');
    if (project.architect) {
      if (project.architect.e2e) {
        expect(project.architect.e2e.options.protractorConfig).toEqual('pkg/app/foo/e2e/protractor.conf.js');
      }
      if (project.architect.lint) {
        expect(project.architect.lint.options.tsConfig).toEqual('pkg/app/foo/e2e/tsconfig.e2e.json');
      }
    }
  });

  it('should scope a new application to the workspace name', () => {
    const tree: UnitTestTree = schematicRunner.runSchematic('ng-app', { name: 'foo' }, workspaceTree);
    const appPkg = JSON.parse(tree.readContent('/pkg/app/foo/package.json'));
    expect(appPkg.name).toEqual('@bar/foo');
  });

  it('should work when application name contains the workspace name as scope', () => {
    const tree: UnitTestTree = schematicRunner.runSchematic('ng-app', { name: '@bar/foo' }, workspaceTree);
    const appPkg = JSON.parse(tree.readContent('/pkg/app/foo/package.json'));
    expect(appPkg.name).toEqual('@bar/foo');
  });

  it('should fail with a schematic exception when app name contains a scope different than the workspace name', () => {});
});

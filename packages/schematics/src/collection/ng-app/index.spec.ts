import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';
import * as ng from './../../core/ng';

function getJsonFileContent(projectName: string, relativePath: string, tree: UnitTestTree): any {
  const rootPkg = JSON.parse(tree.readContent('/package.json'));
  const newPackageRoot = rootPkg.wx.newPackageRoot;
  const libPackageRoot = rootPkg.wx.libPackageRoot;
  const path = `/${newPackageRoot}/${libPackageRoot}/${projectName}/${relativePath}`;
  const json = JSON.parse(tree.readContent(path));
  return json;
}
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
    expect(files).toContain('/pkg/app/foo/tsconfig.app.json');
  });

  it('should update the angular workspace configuration for the app', () => {
    const tree = schematicRunner.runSchematic('ng-app', { name: 'foo' }, workspaceTree);
    const project = ng.getProject('foo', tree);
    expect(project.root).toEqual('pkg/app/foo');
    expect(project.sourceRoot).toEqual('pkg/app/foo/src');
    if (project.architect) {
      if (project.architect.build) {
        expect(project.architect.build.options.index).toEqual(`${project.sourceRoot}/index.html`);
        expect(project.architect.build.options.main).toEqual(`${project.sourceRoot}/main.ts`);
        expect(project.architect.build.options.polyfills).toEqual(`${project.sourceRoot}/polyfills.ts`);
        expect(project.architect.build.options.tsConfig).toEqual(`${project.root}/tsconfig.app.json`);
        expect(project.architect.build.options.assets).toContain(`${project.sourceRoot}/favicon.ico`);
        expect(project.architect.build.options.assets).toContain(`${project.sourceRoot}/assets`);
        expect(project.architect.build.options.styles).toContain(`${project.sourceRoot}/styles.css`);
        expect(project.architect.build.configurations!.production.fileReplacements).toContainEqual({
          replace: `${project.sourceRoot}/environments/environment.ts`,
          with: `${project.sourceRoot}/environments/environment.prod.ts`
        });
      }
      if (project.architect.lint) {
        expect(project.architect.lint.options.tsConfig).toEqual(
          expect.arrayContaining(['pkg/app/foo/tsconfig.app.json', 'pkg/app/foo/tsconfig.spec.json'])
        );
      }
    }
  });

  it('should update the tslint config file for the app', () => {
    const tree = schematicRunner.runSchematic('ng-app', { name: 'foo' }, workspaceTree);
    let tslint = JSON.parse(tree.readContent('pkg/app/foo/tslint.json'));
    expect(tslint.extends).toMatch('../../../tslint.json');
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

  it('should update the ts configuration files with the correct relative path to the workspace root', () => {
    const tree: UnitTestTree = schematicRunner.runSchematic('ng-app', defaultApplicationOpts, workspaceTree);
    const project = ng.getProject('foo-e2e', tree);
    let tsconfig = JSON.parse(tree.readContent(`${project.root}/tsconfig.e2e.json`));
    expect(tsconfig.extends).toMatch('../../../../tsconfig.json');
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

  it('should set angular defaultProject configuration value if called after a ng-lib was generated', () => {
    let tree: UnitTestTree = schematicRunner.runSchematic('ng-lib', { name: '@notbar/foo' }, workspaceTree);
    let ngWorkspaceConfig = ng.getWorkspaceConfig(tree);
    expect(ngWorkspaceConfig.defaultProject).toBeUndefined();

    tree = schematicRunner.runSchematic('ng-app', { name: 'foo' }, tree);
    ngWorkspaceConfig = ng.getWorkspaceConfig(tree);
    expect(ngWorkspaceConfig.defaultProject).toEqual('foo');
  });

  it('should not generate test files or configuration when called with --unitTestRunner=none ', () => {
    const tree: UnitTestTree = schematicRunner.runSchematic('ng-app', { name: 'foo', unitTestRunner: 'none' }, workspaceTree);

    expect(tree.files).not.toContain('/pkg/app/foo/jest.conf.js');
    expect(tree.files).not.toContain('/pkg/app/foo/karma.conf.js');
    expect(tree.files).not.toContain('/pkg/app/foo/tsconfig.spec.ts');
    expect(tree.files).not.toContain('/pkg/app/foo/src/test.ts');

    const project = ng.getProject('foo', tree);

    if (project.architect) {
      expect(project.architect.test).toBeUndefined();
      expect(project.architect.lint!.options!.tsConfig).not.toContain('pkg/app/foo/tsconfig.spec.json');
    }
  });

  it('should generate jest test files or configuration when called with --unitTestRunner=jest ', () => {
    const tree: UnitTestTree = schematicRunner.runSchematic('ng-app', { name: 'foo', unitTestRunner: 'jest' }, workspaceTree);

    expect(tree.files).not.toContain('/pkg/app/foo/jest.conf.js');

    expect(tree.files).toContain('/pkg/app/foo/tsconfig.spec.json');
    expect(tree.files).toContain('/pkg/app/foo/src/test.ts');

    const project = ng.getProject('foo', tree);

    if (project.architect) {
      expect(project.architect.test).not.toBeUndefined();
      expect(project.architect.lint!.options!.tsConfig).toContain('pkg/app/foo/tsconfig.spec.json');
    }
  });
});

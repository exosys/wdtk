import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';

describe('Angular Application Schematic', () => {
  const schematicRunner = new SchematicTestRunner('@wdtk/schematics', require.resolve('../../../collection.json'));

  const workspaceOpts: WorkspaceOptions = {
    name: 'work',
    newProjectRoot: 'projects',
    version: '7.0.0'
  };

  const applicationOpts: ApplicationOptions = {
    name: 'foo',
    inlineStyle: false,
    inlineTemplate: false,
    routing: false,
    skipPackageJson: false
  };

  it('should create all files of an application', () => {
    let workspaceTree: UnitTestTree;
    // workspaceTree = schematicRunner.runExternalSchematic('@schematics/angular', 'workspace', workspaceOpts);

    // const options = {};

    // const tree = schematicRunner.runSchematic('ng-app', options);
  });
  it('should not do something', () => {});
});

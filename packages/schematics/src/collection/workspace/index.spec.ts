import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from './schema';

describe('workspace schematic', () => {
  const schematicRunner = new SchematicTestRunner('@wdtk/schematics', require.resolve('../../../collection.json'));
  const defaultWorkspaceOptions: WorkspaceOptions = {
    name: 'bar'
  };

  it('should create required files ', () => {
    const opts = { ...defaultWorkspaceOptions };
    const tree = schematicRunner.runSchematic('workspace', opts);
    const files = tree.files;

    expect(files).toContain('/.gitignore');
    expect(files).toContain('/package.json');
    expect(files).toContain('/lerna.json');
    expect(files).toContain('/tsconfig.json');
    expect(files).toContain('/tslint.json');
  });

  it('should set the name in package.json', () => {
    const opts = { ...defaultWorkspaceOptions };
    const tree = schematicRunner.runSchematic('workspace', opts);
    const pkg = JSON.parse(tree.readContent('/package.json'));
    expect(pkg.name).toEqual('bar');
  });
});

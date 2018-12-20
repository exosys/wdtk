import { SchematicCommand } from '../../core/command/schematic-command';
import { Schema as NewCommandSchema } from './schema';
import { Arguments, SubCommandDescription } from '../../core/command';
export class NewCommand extends SchematicCommand<NewCommandSchema> {
  public readonly allowMissingWorkspace = true;
  public async run(options: NewCommandSchema & Arguments) {
    return this.runSchematic({
      collectionName: this.collectionName,
      schematicName: 'workspace',
      schematicOptions: options['--'] || [],
      debug: !!options.debug || false,
      dryRun: !!options.dryRun || false,
      force: !!options.force || false
    });
  }
}

import { Schema as VersionCommandSchema } from './schema';
import { Command } from '../../core/command';
export class VersionCommand extends Command<VersionCommandSchema> {
  async run() {
    console.error('Something');
    console.error(`Node: ${process.versions.node}`);
  }
}

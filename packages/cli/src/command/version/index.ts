import { Schema as VersionCommandSchema } from './schema';
import { AbstractCommand } from '../../core/command';
export class VersionCommand extends AbstractCommand<VersionCommandSchema> {
  async run() {
    this.logger.info(`Node: ${process.versions.node}`);
  }
}

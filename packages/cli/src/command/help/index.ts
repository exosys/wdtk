/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { terminal } from '@angular-devkit/core';
import { AbstractCommand } from '../../core/command';
import { Schema as HelpCommandSchema } from './schema';
export class HelpCommand extends AbstractCommand<HelpCommandSchema> {
  async run() {
    this.logger.info(`Available Commands:`);

    for (const name of Object.keys(AbstractCommand.commandMap)) {
      const cmd = AbstractCommand.commandMap[name];

      if (cmd.hidden) {
        continue;
      }

      const aliasInfo = cmd.aliases.length > 0 ? ` (${cmd.aliases.join(', ')})` : '';
      this.logger.info(`  ${terminal.cyan(cmd.name)}${aliasInfo} ${cmd.description}`);
    }
    this.logger.info(`\nFor more detailed help run "wx [command name] --help"`);
  }
}

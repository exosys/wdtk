/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { logging, strings, tags, terminal } from '@angular-devkit/core';
import { CommandContext, CommandWorkspace, CommandDescription, CommandDescriptionMap } from './defs';
import { Arguments, Option, SubCommandDescription, CommandScope } from './defs';
export interface BaseCommandOptions {
  help?: boolean | string;
}

export abstract class AbstractCommand<T extends BaseCommandOptions = BaseCommandOptions> {
  public allowMissingWorkspace = false;
  public workspace: CommandWorkspace;
  public readonly description: CommandDescription;
  protected static commandMap: CommandDescriptionMap;
  static setCommandMap(map: CommandDescriptionMap) {
    this.commandMap = map;
  }
  protected readonly logger: logging.Logger;

  constructor(context: CommandContext, description: CommandDescription, logger: logging.Logger) {
    this.workspace = context.workspace;
    this.description = description;
    this.logger = logger;
  }

  async initialize(options: T & Arguments): Promise<void> {
    return;
  }

  async validateScope(scope?: CommandScope): Promise<void> {
    switch (scope === undefined ? this.description.scope : scope) {
      case CommandScope.OutProject:
        if (this.workspace.configFile) {
          this.logger.fatal(tags.oneLine`
            The ${this.description.name} command requires to be run outside of a project, but a
            project definition was found at "${this.workspace.configFile}".
          `);
          throw 1;
        }
        break;
      case CommandScope.InProject:
        //FIXME
        if (!this.workspace.configFile /*|| getWorkspace('local') === null*/) {
          this.logger.fatal(tags.oneLine`
            The ${this.description.name} command requires to be run in an Angular project, but a
            project definition could not be found.
          `);
          throw 1;
        }
        break;
      case CommandScope.Everywhere:
        // Can't miss this.
        break;
    }
  }

  async validateAndRun(options: T & Arguments): Promise<number | void> {
    if (!(options.help === true || options.help === 'json' || options.help === 'JSON')) {
      await this.validateScope();
    }
    await this.initialize(options);

    if (options.help === true) {
      return this.printHelp(options);
    } else if (options.help === 'json' || options.help === 'JSON') {
      return this.printJsonHelp(options);
    } else {
      return await this.run(options);
    }
  }

  abstract async run(options: T & Arguments): Promise<number | void>;

  async printHelp(options: T & Arguments): Promise<number> {
    await this.printHelpUsage();
    await this.printHelpOptions();

    return 0;
  }

  async printJsonHelp(_options: T & Arguments): Promise<number> {
    this.logger.info(JSON.stringify(this.description));

    return 0;
  }

  protected async printHelpUsage() {
    this.logger.info(this.description.description);

    const name = this.description.name;
    const args = this.description.options.filter(x => x.positional !== undefined);
    const opts = this.description.options.filter(x => x.positional === undefined);

    const argDisplay = args && args.length > 0 ? ' ' + args.map(a => `<${a.name}>`).join(' ') : '';
    const optionsDisplay = opts && opts.length > 0 ? ` [options]` : ``;

    //FIXME use product.shortName
    this.logger.info(`usage: wx ${name}${argDisplay}${optionsDisplay}`);
    this.logger.info('');
  }

  protected async printHelpSubcommand(subcommand: SubCommandDescription) {
    this.logger.info(subcommand.description);

    await this.printHelpOptions(subcommand.options);
  }

  protected async printHelpOptions(options: Option[] = this.description.options) {
    const args = options.filter(opt => opt.positional !== undefined);
    const opts = options.filter(opt => opt.positional === undefined);

    const formatDescription = (description: string) => `    ${description.replace(/\n/g, '\n    ')}`;

    if (args.length > 0) {
      this.logger.info(`arguments:`);
      args.forEach(o => {
        this.logger.info(`  ${terminal.cyan(o.name)}`);
        if (o.description) {
          this.logger.info(formatDescription(o.description));
        }
      });
    }
    if (options.length > 0) {
      if (args.length > 0) {
        this.logger.info('');
      }
      this.logger.info(`options:`);
      opts
        .filter(o => !o.hidden)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(o => {
          const aliases = o.aliases && o.aliases.length > 0 ? '(' + o.aliases.map(a => `-${a}`).join(' ') + ')' : '';
          this.logger.info(`  ${terminal.cyan('--' + strings.dasherize(o.name))} ${aliases}`);
          if (o.description) {
            this.logger.info(formatDescription(o.description));
          }
        });
    }
  }
}

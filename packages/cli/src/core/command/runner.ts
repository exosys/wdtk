/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { logging, json, JsonParseMode, isJsonObject, schema } from '@angular-devkit/core';
import { tags, strings } from '@angular-devkit/core';
import { CommandWorkspace, CommandDescription, CommandDescriptionMap } from './defs';
import { findUp } from '../workspace';
import { dirname, resolve, join } from 'path';
import { readFileSync } from 'fs';
import { parseJsonSchemaToCommandDescription } from './schema';
import { AbstractCommand } from './abstract-command';
import { parseArguments, ParseArgumentException } from './parser';

export interface CommandMapOptions {
  [key: string]: string;
}
export async function runCommand(
  args: string[],
  logger: logging.Logger,
  workspace: CommandWorkspace,
  commands?: CommandMapOptions
): Promise<number | void> {
  if (commands === undefined) {
    const commandMapPath = findUp('commands.json', __dirname);
    if (commandMapPath === null) {
      throw new Error('Failed to find command map.');
    }
    const cliDir = dirname(commandMapPath);
    const cmdsText = readFileSync(commandMapPath).toString('utf-8');
    const cmdsJson = json.parseJson(cmdsText, JsonParseMode.Loose, { path: commandMapPath });
    if (!isJsonObject(cmdsJson)) {
      throw new Error('Invalid JSON in command map.');
    }
    commands = {};
    for (const name of Object.keys(<any>cmdsJson)) {
      const value = (<any>cmdsJson)[name];
      if (typeof value === 'string') {
        commands[name] = resolve(cliDir, value);
      }
    }

    const registry = new schema.CoreSchemaRegistry([]);
    registry.registerUriHandler((uri: string) => {
      if (uri.startsWith('wx://')) {
        const definitionsPath = join(__dirname, '..', '..', uri.substr('wx://'.length));
        const definitions = readFileSync(definitionsPath, 'utf-8');
        return Promise.resolve(JSON.parse(definitions));
      }
      return null;
    });

    const commandMap: CommandDescriptionMap = {};
    for (const name of Object.keys(commands)) {
      const schemaPath = commands[name];
      const schemaText = readFileSync(schemaPath, 'utf-8');
      const schema = json.parseJson(schemaText, JsonParseMode.Loose, { path: schemaPath });
      if (!isJsonObject(schema)) {
        throw new Error(`Invalid JSON command schema (${schemaPath})`);
      }
      commandMap[name] = await parseJsonSchemaToCommandDescription(name, schemaPath, registry, schema);
    }

    let commandName: string | undefined = undefined;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg in commandMap) {
        commandName = arg;
        args.splice(i, 1);
        break;
      } else if (!arg.startsWith('-')) {
        commandName = arg;
        args.splice(i, 1);
        break;
      }
    }

    // if no commands were found, use `help`.
    if (commandName === undefined) {
      if (args.length === 1 && args[0] === '--version') {
        commandName = 'version';
      } else {
        commandName = 'help';
      }
    }

    let description: CommandDescription | null = null;

    if (commandName !== undefined) {
      if (commandMap[commandName]) {
        description = commandMap[commandName];
      } else {
        Object.keys(commandMap).forEach(name => {
          const commandDescription = commandMap[name];
          const aliases = commandDescription.aliases;

          let found = false;
          if (aliases) {
            if (aliases.some(alias => alias === commandName)) {
              found = true;
            }
          }

          if (found) {
            if (description) {
              throw new Error('Found multiple commands with the same alias.');
            }
            commandName = name;
            description = commandDescription;
          }
        });
      }
    }

    if (!commandName) {
      logger.error(tags.stripIndent`
          We could not find a command from the arguments and the help command seems to be disabled.
          This is an issue with the CLI itself. If you see this comment, please report it and
          provide your repository.
        `);

      return 1;
    }

    if (!description) {
      const commandsDistance = {} as { [name: string]: number };
      const name = commandName;
      const allCommands = Object.keys(commandMap).sort((a, b) => {
        if (!(a in commandsDistance)) {
          commandsDistance[a] = strings.levenshtein(a, name);
        }
        if (!(b in commandsDistance)) {
          commandsDistance[b] = strings.levenshtein(b, name);
        }

        return commandsDistance[a] - commandsDistance[b];
      });
      //FIXME replace wx with process.title
      logger.error(tags.stripIndent`
          The specified command ("${commandName}") is invalid. For a list of available options,
          run "wx help".
  
          Did you mean "${allCommands[0]}"?
      `);

      return 1;
    }

    try {
      const parsedOptions = parseArguments(args, description.options, logger);
      AbstractCommand.setCommandMap(commandMap);
      const command = new description.impl({ workspace }, description, logger);

      return await command.validateAndRun(parsedOptions);
    } catch (e) {
      if (e instanceof ParseArgumentException) {
        logger.fatal('Cannot parse arguments. See below for the reasons.');
        logger.fatal('    ' + e.comments.join('\n    '));

        return 1;
      } else {
        throw e;
      }
    }
  }
}

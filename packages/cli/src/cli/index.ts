/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { createConsoleLogger } from '@angular-devkit/core/node';
import { runCommand } from '../core/command';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';
import { getWorkspaceDetails } from '../core/workspace';
import { worker } from 'cluster';

export default async function(options: { testing?: boolean; cliArgs: string[] }) {
  const logger = createConsoleLogger();
  let workspace = getWorkspaceDetails();
  try {
    const maybeExitCode = await runCommand(options.cliArgs, logger, workspace!);

    if (typeof maybeExitCode === 'number') {
      console.assert(Number.isInteger(maybeExitCode));
      return maybeExitCode;
    }
    return 0;
  } catch (error) {
    if (error instanceof Error) {
      logger.fatal(error.message);
      if (error.stack) {
        logger.fatal(error.stack);
      }
    } else if (typeof error === 'string') {
      logger.fatal(error);
    } else if (typeof error === 'number') {
      // Log nothing.
    } else {
      logger.fatal('An unexpected error occurred: ' + JSON.stringify(error));
    }

    if (options.testing) {
      debugger;
      throw error;
    }
    return 1;
  }
}

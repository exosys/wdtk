/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import 'symbol-observable';

let cli;
cli = require('./cli');

if ('default' in cli) {
  cli = cli['default'];
}

cli({ cliArgs: process.argv.slice(2) })
  .then((exitCode: number) => {
    process.exit(exitCode);
  })
  .catch((error: Error) => {
    console.error('Unknown error :' + error.toString());
    process.exit(127);
  });

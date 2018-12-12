/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Schema as VersionCommandSchema } from './schema';
import { AbstractCommand } from '../../core/command';
export class VersionCommand extends AbstractCommand<VersionCommandSchema> {
  async run() {
    this.logger.info(`Node: ${process.versions.node}`);
  }
}

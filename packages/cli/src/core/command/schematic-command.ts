/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

export interface BaseSchematicSchema {
  debug?: boolean;
  dryRun?: boolean;
  force?: boolean;
  interactive?: boolean;
  defaults?: boolean;
}

export interface RunSchematicOptions extends BaseSchematicSchema {
  collectionName: string;
  schematicName: string;
  additionalOptions?: { [key: string]: {} };
  schematicOptions?: string[];
  showNothingDone?: boolean;
}

export class UnknownCollectionError extends Error {
  constructor(collectionName: string) {
    super(`Invalid collection (${collectionName}).`);
  }
}

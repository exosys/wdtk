/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Lists available commands and their short descriptions.
 */
export interface Schema {
  /**
   * Shows a help message for this command in the console.
   */
  help?: HelpUnion;
}
/**
 * Shows a help message for this command in the console.
 */
export declare type HelpUnion = boolean | HelpEnum;
export declare enum HelpEnum {
  HelpJSON = 'JSON',
  JSON = 'json'
}

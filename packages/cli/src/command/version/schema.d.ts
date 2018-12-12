/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export interface Schema {
  help?: VersionUnion;
}

export declare type VersionUnion = boolean | VersionEnum;

export declare enum VersionEnum {
  HelpJSON = 'JSON',
  JSON = 'json'
}

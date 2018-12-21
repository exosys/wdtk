import { normalize } from '@angular-devkit/core';
import { Tree } from '@angular-devkit/schematics';
/**
 * Returns the relative offset from workspace root for the given project.
 * @param projectRoot
 */
export function relativeOffsetFromWorkspaceRoot(projectRoot: string) {
  const parts = normalize(projectRoot).split('/');
  let offset = '';
  for (let i = 0; i < parts.length; ++i) {
    offset += '../';
  }
  return offset;
}

export function getScope(tree: Tree): string {
  return JSON.parse(tree.read('package.json')!.toString('utf-8')).name.replace('@', '');
}

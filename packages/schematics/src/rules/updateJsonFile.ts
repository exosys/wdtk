import { Rule, Tree } from '@angular-devkit/schematics';
import { parseJson } from '@angular-devkit/core';

interface UpdateJsonFn<T> {
  (obj: T): T | void;
}

export function updateJsonFile<T>(path: string, callback: UpdateJsonFn<T>): Rule {
  return (tree: Tree) => {
    const source = tree.read(path);
    if (source) {
      const text = source.toString('utf-8');
      const json = parseJson(text);
      callback((json as {}) as T);
      tree.overwrite(path, JSON.stringify(json, null, 2));
    }
    return tree;
  };
}

import { Rule, Tree, chain } from '@angular-devkit/schematics';
import { join, normalize, DependencyNotFoundException } from '@angular-devkit/core';
import * as ng from '../../core/ng';
import { updateJsonFile } from './../update-json-file';

export function updateKarma<T>(projectName: string): Rule {
  return (tree: Tree) => {
    return tree;
  };
}

import { strings } from '@angular-devkit/core';
import { Rule, Tree, SchematicContext, SchematicsException, MergeStrategy, noop, branchAndMerge } from '@angular-devkit/schematics';
import { chain, mergeWith, apply, url, template, move } from '@angular-devkit/schematics';
import { parseName } from '@schematics/angular/utility/parse-name';
import { buildDefaultPath } from '@schematics/angular/utility/project';
import { Schema as Options } from './schema';
import * as ng from '../../../core/ng';

export default function(options: Options): Rule {
  return (tree: Tree) => {
    throw new SchematicsException('y');
  };
}

function normalizeOptions(options: Options, tree: Tree) {
  const t = options;
  return {
    ...options
  };
}

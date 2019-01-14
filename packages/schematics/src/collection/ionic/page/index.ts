import { Rule, Tree, SchematicContext, SchematicsException, MergeStrategy, noop } from '@angular-devkit/schematics';
import { chain, mergeWith, apply, url, template } from '@angular-devkit/schematics';

import { Schema as Options } from './schema';

export default function(options: Options): Rule {
  return (tree: Tree) => {
    return tree;
  };
}

import { Rule, Tree, SchematicContext, SchematicsException, MergeStrategy, noop } from '@angular-devkit/schematics';
import { chain, mergeWith, apply, url, template, filter } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import { Schema as Options } from './schema';
import { updateJsonFile } from '../../rules/update-json-file';

export interface NormalizedOptions extends Options {}

export default function(options: Options): Rule {
  return (tree: Tree) => {
    const opts = normalizeOptions(options, tree);
    return chain([
      mergeWith(
        apply(url('./files'), [
          template({
            ...opts
          }),
          filter(file => {
            return !tree.exists(file);
          })
        ])
      ),
      addDependencies(opts),
      addInstallTask(opts)
    ]);
  };
}

function addDependencies(opts: NormalizedOptions): Rule {
  return (tree: Tree) => {
    return updateJsonFile('/package.json', (json: any) => {
      json.dependencies = {
        ...json.dependencies
      };
    });
  };
}
function addInstallTask(opts: NormalizedOptions): Rule {
  return (_: Tree, context: SchematicContext) => {
    if (!opts.skipInstall) {
      context.addTask(new NodePackageInstallTask());
    }
  };
}

function normalizeOptions(options: Options, tree: Tree): NormalizedOptions {
  return {
    ...options
  };
}

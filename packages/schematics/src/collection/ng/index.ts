import { Rule, Tree, SchematicContext, SchematicsException, MergeStrategy, noop } from '@angular-devkit/schematics';
import { chain, mergeWith, apply, url, template, filter } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { NodeDependency, NodeDependencyType } from '@schematics/angular/utility/dependencies';
import { Schema as Options } from './schema';
import { updateJsonFile } from '../../rules/update-json-file';
import { addWorkspaceDependencies } from './../../util/dependencies';
import * as ng from '../../core/ng';

const versions = {
  ...ng.versions
};
// '@angular/compiler': `${ng.versions.Angular}`
const ROOT_DEPENDENCIES = [
  { type: NodeDependencyType.Dev, name: '@angular/compiler', version: `${versions.Angular}` },
  { type: NodeDependencyType.Dev, name: '@angular/compiler-cli', version: `${versions.Angular}` },
  { type: NodeDependencyType.Dev, name: '@angular-devkit/core', version: `${versions.Angular}` },
  { type: NodeDependencyType.Dev, name: '@angular-devkit/architect', version: `${versions.DevkitBuildAngular}` },
  { type: NodeDependencyType.Dev, name: '@angular-devkit/build-angular', version: `${versions.DevkitBuildAngular}` },
  { type: NodeDependencyType.Dev, name: '@angular-devkit/schematics', version: `${versions.Angular}` }
];

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
    addWorkspaceDependencies(tree, ROOT_DEPENDENCIES);
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

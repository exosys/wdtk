import { Rule, Tree, SchematicContext, SchematicsException, MergeStrategy, noop } from '@angular-devkit/schematics';
import { chain, mergeWith, apply, url, template } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import { versions } from './../../versions';

import { Schema as Options } from './schema';
import { updateJsonFile } from '../../rules/update-json-file';

export interface NormalizedOptions extends Options {
    skipConfigFile : boolean;
}

export default function(options: Options): Rule {
  return (tree: Tree) => {
    const opts: NormalizedOptions = normalizeOptions(options,tree);
    return chain([
      !opts.skipConfigFile?  mergeWith(apply(url('./files'), [template({})])):noop(),
      updateJsonFile('/package.json', (json: any) => {
          json.devDependencies = {
              ...json.devDependencies,
              jest: `^${versions.jest}`,
              '@types/jest': `^${versions.jestTypes}`
         
          }
      }),
      addInstallTask(opts)
    ]);
  };
}


function addInstallTask(opts: NormalizedOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (!opts.skipInstall) {
      context.addTask(new NodePackageInstallTask());
    }
  };
}

function normalizeOptions(options: Options, tree:Tree): NormalizedOptions {
    // do not overwrite jest.config if it exists
    let skipConfigFile = false;
    if(tree.exists('/jest.config.js')) {
        skipConfigFile = true;
    }
  return {
    ...options,
    skipConfigFile:skipConfigFile
  };
}

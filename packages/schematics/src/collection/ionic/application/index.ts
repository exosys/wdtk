import { Rule, Tree, SchematicContext, SchematicsException, MergeStrategy, noop, SchematicEngine } from '@angular-devkit/schematics';
import { chain, mergeWith, apply, url, template } from '@angular-devkit/schematics';

import { Schema as Options } from './schema';
import { updateJsonFile } from '../../../rules/update-json-file';
import * as ng from './../../../angular';
import * as wdtk from './../../../versions';
export interface NormalizedOptions extends Options {
  projectPath: string;
}

export default function(options: Options): Rule {
  return (tree: Tree) => {
    const opts = normalizeOptions(options, tree);
    const templateSource = apply(url('./files'), [template({ ...options })]);
    //prettier-ignore
    return chain([
        mergeWith(templateSource), 
        addDependencies(opts)
    ]);
  };
}

function addDependencies(opts: NormalizedOptions): Rule {
  return (tree: Tree) => {
    const versions = { ...ng.versions, ...wdtk.versions };
    return updateJsonFile(`${opts.projectPath}/package.json`, (json: any) => {
      json.dependencies = {
        ...json.dependencies,
        '@ionic/angular': `${versions.ionicAngular}`,
        '@ionic-native/core': `${versions.ionicNative}`,
        '@ionic-native/splash-screen': `${versions.ionicNative}`,
        '@ionic-native/status-bar': `${versions.ionicNative}`
      };
      json.devDependencies = {
        ...json.devDependencies,
        '@ionic/angular-toolkit': `${versions.ionicAngularToolkit}`
      };
    });
  };
}

function normalizeOptions(options: Options, tree: Tree): NormalizedOptions {
  const projectName: string = options.name;

  const project = ng.getProject(projectName, tree);

  const projectPath = project.root;
  const projectType = project.projectType;
  if (projectType !== 'application') {
    throw new SchematicsException(`Cannot add 'ionic' support to '${projectName}'(not an application).`);
  }
  return {
    ...options,
    projectPath: projectPath
  };
}

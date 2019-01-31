import {
  Rule,
  Tree,
  SchematicContext,
  MergeStrategy,
  externalSchematic,
  SchematicsException,
  schematic,
  noop
} from '@angular-devkit/schematics';
import { mergeWith, apply, template, url, chain, move } from '@angular-devkit/schematics';
import { Schema as Options } from './schema';
import { join, normalize, Path } from '@angular-devkit/core';

import * as ng from '../../core/ng';
import { dasherize } from '@angular-devkit/core/src/utils/strings';
import { updateJsonFile } from '../../rules/update-json-file';
import { updateWorkspace } from '@schematics/angular/utility/config';
import { removeKarma, updateKarma } from '../../rules/karma';

interface NormalizedOptions extends Options {
  newProjectRoot: string;
  name: string;
  projectRoot: string;
  origProjectRoot: string;
  destProjectRoot: string;
  entryType: string;
  // entryFile: string;
}

// name: options.name,
// prefix: options.prefix,
// style: options.style,
// entryFile: 'index',
// skipPackageJson: !options.publishable,
// skipTsConfig: true

// "@angular-devkit/build-angular": "~0.11.0",
// "@angular-devkit/build-ng-packagr": "~0.11.0",
// "@angular/compiler-cli": "7.1.0",
// "@angular/compiler": "^7.1.0",
// "@angular/core": "^7.1.0",
// "@angular/common": "^7.1.0",
// "rxjs": "^6.0.6",
// "zone.js": "0.8.26",
// "lerna": "3.4.3",
// "ng-packagr": "^4.2.0",
// "tsickle": ">=0.29.0",
// "tslib": "^1.9.0",
// "typescript": "~3.1.6"

const DEFAULT_LIB_DIR = 'lib';
export default function(options: Options): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const opts = normalizeOptions(tree, options);

    //prettier-ignore
    const relativePathToWorkspaceRoot = opts.projectRoot.split('/').map(x => '..').join('/');

    ng.versions.Angular = ng.versions.Angular.replace('~', '').replace('^', '');
    const versions = { ...ng.versions };
    return chain([
      schematic('ng', { packagesRoot: opts.newProjectRoot, skipInstall: opts.skipInstall }),
      externalSchematic('@schematics/angular', 'library', opts),
      move(opts.origProjectRoot, opts.destProjectRoot),
      mergeWith(apply(url('./files'), [template({ ...opts, versions, dasherize: dasherize, index: 'index.ts' })]), MergeStrategy.Overwrite),

      updateWorkspaceNgConf(opts),
      updateProjectNgConf(opts),

      opts.entryType === 'primary'
        ? updateJsonFile(`${opts.projectRoot}/tsconfig.lib.json`, (json: any) => {
            json.extends = `${relativePathToWorkspaceRoot}/tsconfig.json`;
            json.exclude.push('**/*-spec.ts');
            json.compilerOptions.outDir = `./out/tsc`;
            //   json.compilerOptions.outDir = `${relativePathToWorkspaceRoot}/dist/out-tsc/${wxProjectRoot}`;
          })
        : (tree: Tree) => {
            tree.delete(`${opts.projectRoot}/tsconfig.lib.json`);
          },
      opts.entryType === 'primary'
        ? updateJsonFile(`${opts.projectRoot}/tsconfig.spec.json`, (json: any) => {
            json.extends = `${relativePathToWorkspaceRoot}/tsconfig.json`;
            json.compilerOptions.outDir = `./out/tsc`;
            //   json.compilerOptions.outDir = `${relativePathToWorkspaceRoot}/dist/out-tsc/${wxProjectRoot}`;
          })
        : noop(), //let remove karma rule to deal with this file
      opts.entryType === 'primary'
        ? updateJsonFile(`${opts.projectRoot}/tslint.json`, (json: any) => {
            json.extends = `${relativePathToWorkspaceRoot}/tslint.json`;
          })
        : (tree: Tree) => {
            if (tree.exists(`${opts.projectRoot}/tslint.json`)) {
              tree.delete(`${opts.projectRoot}/tslint.json`);
            }
          },
      opts.entryType === 'primary'
        ? updateJsonFile(`${opts.projectRoot}/ng-package.json`, (json: any) => {
            // correct the $schema path
            json.$schema = `${relativePathToWorkspaceRoot}/node_modules/ng-packagr/ng-package.schema.json`;
            // change the ng-packager `dest` dir to be contained within the project's root dir
            // to be compatible with other package managers (lerna, yarn)
            json.dest = './dist';
          })
        : (tree: Tree) => {
            if (tree.exists(`${opts.projectRoot}/ng-package.json`)) {
              tree.delete(`${opts.projectRoot}/ng-package.json`);
            }
          },
      opts.entryType === 'primary'
        ? updateJsonFile('/tsconfig.json', (json: any) => {
            const compilerOptions = json.compilerOptions;
            if (compilerOptions.paths) {
              //remove entries created by the angular schematic
              if (compilerOptions.paths[opts.name]) {
                delete compilerOptions.paths[opts.name];
              }
              if (compilerOptions.paths[`${opts.name}/*`]) {
                delete compilerOptions.paths[`${opts.name}/*`];
              }
            } else {
              compilerOptions.paths = {};
            }
            compilerOptions.paths[opts.name] = [`${opts.projectRoot}/src/`];
            compilerOptions.paths[`${opts.name}/*`] = [`${opts.projectRoot}/*/src/`];
          })
        : noop(),
      opts.entryType === 'secondary'
        ? updateJsonFile(`${opts.projectRoot}/package.json`, (json: any) => {
            Object.keys(json).forEach(function(key) {
              delete json[key];
            });
            json.ngPackage = {};
          })
        : noop(),
      opts.unitTestRunner !== 'karma' ? removeKarma(opts.name) : updateKarma(opts.name),
      opts.unitTestRunner === 'jest' ? schematic('ng-jest', { project: opts.name, skipInstall: opts.skipInstall }) : noop(),

      // we have to remove angular workspace configuration entry last because otherwise rules that rely on the ng project's
      // configuration will fail

      opts.entryType !== 'primary'
        ? (tree: Tree) => {
            const ngWorkspaceConf = ng.getWorkspaceConfig(tree);
            if (ngWorkspaceConf.projects[opts.name]) {
              delete ngWorkspaceConf.projects[opts.name];
              return ng.updateWorkspaceConfig(ngWorkspaceConf);
            }
          }
        : noop()
    ]);
  };
}

function updateWorkspaceNgConf(opts: NormalizedOptions): Rule {
  return (tree: Tree) => {
    const workspaceConf = ng.getWorkspaceConfig(tree);
    if (workspaceConf.defaultProject) {
      if (workspaceConf.defaultProject === opts.name) {
        delete workspaceConf.defaultProject;
        return ng.updateWorkspaceConfig(workspaceConf);
      }
    }
  };
}
function updateProjectNgConf(opts: NormalizedOptions): Rule {
  return (tree: Tree) => {
    const projectRoot: Path = normalize(opts.projectRoot);
    const projectName: string = `${opts.name}`;

    const project = ng.getProject(projectName, tree);
    if (!project) {
      throw new SchematicsException();
    }

    project.root = projectRoot;
    project.sourceRoot = join(projectRoot, 'src');

    if (project.architect) {
      const architect: ng.WorkspaceTargets<ng.ProjectType.Library> = (<ng.WorkspaceTargets<ng.ProjectType.Library>>project).architect;
      if (architect.build) {
        architect.build.options.tsConfig = join(projectRoot, 'tsconfig.lib.json');
        architect.build.options.project = join(projectRoot, 'ng-package.json');
      }
      // if (architect.test) {
      //   architect.test.options.main = join(projectRoot, 'src', 'test.ts');
      //   architect.test.options.tsConfig = join(projectRoot, 'tsconfig.spec.json');
      //   architect.test.options.karmaConfig = join(projectRoot, 'karma.conf.js');
      // }
      if (
        architect.lint
      ) {
        //prettier-ignore
        // architect.lint.options.tsConfig.push()
        // architect.lint.options.tsConfig = [
        //   join(projectRoot, 'tsconfig.lib.json'), 
          // join(projectRoot, 'tsconfig.spec.json')];
      }
    }

    return ng.updateProject(projectName, project);
  };
}

function normalizeOptions(tree: Tree, options: Options): NormalizedOptions {
  // FIXME : since generate can work outside of workspace verify we have a package.json
  const workspaceConf = JSON.parse(tree.read('/package.json')!.toString());
  const workspaceName = workspaceConf.name;
  // FIXME : check if wx member exists
  const workspaceRoot = workspaceConf.wx.newPackagesRoot;

  let projectPath: string = options.directory ? options.directory : DEFAULT_LIB_DIR;
  let entryType: string = 'primary';
  let unitTestRunner = options.unitTestRunner;
  let skipInstall = options.skipInstall;
  if (options.project) {
    const parentProject = ng.getProject(options.project, tree);
    if (parentProject.projectType === 'library') {
      entryType = 'secondary';
      projectPath = parentProject.root.replace(`${workspaceRoot}/`, '');
      skipInstall = true;
      unitTestRunner = 'none';
    }
  }

  let projectName: string = options.name;

  // if the provided project name is not scoped the project will be named
  // using the workspace name
  let projectScope: string = workspaceName;

  // if the name is already scoped, remove scope so that paths can be computed
  if (/^@.*\/.*/.test(projectName)) {
    const [_scope, _name] = options.name.split('/');
    projectScope = _scope.replace('@', '');
    projectName = _name;
  }
  projectName = dasherize(projectName);
  const projectRoot = `${workspaceRoot}/${projectPath}/${projectName}`;
  const fullProjectName = `@${projectScope}/${projectName}`;

  // the path assigned by underlying ng schematic for this project
  const origProjectRoot = `${workspaceRoot}/${projectScope}/${projectName}`;

  // the path where we want for the project
  const destProjectRoot = `${projectRoot}`;

  const prefix = options.prefix ? options.prefix : projectScope;
  return {
    ...options,
    newProjectRoot: workspaceRoot,
    name: fullProjectName,
    projectRoot: projectRoot,
    origProjectRoot: origProjectRoot,
    destProjectRoot: destProjectRoot,
    prefix: prefix,
    skipInstall: skipInstall,
    unitTestRunner: unitTestRunner,
    entryType: entryType
  };
}

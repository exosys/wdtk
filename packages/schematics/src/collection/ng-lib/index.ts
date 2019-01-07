import { Rule, Tree, SchematicContext, MergeStrategy, externalSchematic, SchematicsException, schematic } from '@angular-devkit/schematics';
import { mergeWith, apply, template, url, chain, move } from '@angular-devkit/schematics';
import { Schema as Options } from './schema';
import { join, normalize, Path } from '@angular-devkit/core';

import * as ng from './../../angular';
import { dasherize } from '@angular-devkit/core/src/utils/strings';
import { updateJsonFile } from '../../rules/update-json-file';
import { updateWorkspace } from '@schematics/angular/utility/config';

interface NormalizedOptions extends Options {
  newProjectRoot: string;
  name: string;
  projectRoot: string;
  origProjectRoot: string;
  destProjectRoot: string;
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
      updateWorkspaceNgConf(opts),
      updateProjectNgConf(opts),

      updateJsonFile(`${opts.projectRoot}/tsconfig.lib.json`, (json: any) => {
        json.extends = `${relativePathToWorkspaceRoot}/tsconfig.json`;
        json.exclude.push('**/*-spec.ts');
        json.compilerOptions.outDir = `./out/tsc`;
        //   json.compilerOptions.outDir = `${relativePathToWorkspaceRoot}/dist/out-tsc/${wxProjectRoot}`;
      }),
      updateJsonFile(`${opts.projectRoot}/tsconfig.spec.json`, (json: any) => {
        json.extends = `${relativePathToWorkspaceRoot}/tsconfig.json`;
        json.compilerOptions.outDir = `./out/tsc`;
        //   json.compilerOptions.outDir = `${relativePathToWorkspaceRoot}/dist/out-tsc/${wxProjectRoot}`;
      }),
      updateJsonFile(`${opts.projectRoot}/tslint.json`, (json: any) => {
        json.extends = `${relativePathToWorkspaceRoot}/tslint.json`;
      }),
      updateJsonFile(`${opts.projectRoot}/ng-package.json`, (json: any) => {
        // correct the $schema path
        json.$schema = `${relativePathToWorkspaceRoot}/node_modules/ng-packagr/ng-package.schema.json`;
        // change the ng-packager `dest` dir to be contained within the project's root dir
        // to be compatible with other package managers (lerna, yarn)
        json.dest = './dist';
      }),
      updateJsonFile('/tsconfig.json', (json: any) => {
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
        compilerOptions.paths[`${opts.name}/*`] = [`${opts.projectRoot}/src/*`];
      }),
      mergeWith(apply(url('./files'), [template({ ...opts, versions, dasherize: dasherize, index: 'index.ts' })]), MergeStrategy.Overwrite)
      // options.unitTestRunner === 'jest' ? schematic('ng-jest', { project: opts.name, skipInstall: opts.skipInstall }) : noop()
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
      if (architect.test) {
        architect.test.options.main = join(projectRoot, 'src', 'test.ts');
        architect.test.options.tsConfig = join(projectRoot, 'tsconfig.spec.json');
        architect.test.options.karmaConfig = join(projectRoot, 'karma.conf.js');
      }
      if (architect.lint) {
        //prettier-ignore
        architect.lint.options.tsConfig = [
          join(projectRoot, 'tsconfig.lib.json'), 
          join(projectRoot, 'tsconfig.spec.json')];
      }
    }

    return ng.updateProject(projectName, project);
  };
}

function normalizeOptions(tree: Tree, options: Options): NormalizedOptions {
  // const ngWorkspaceConf = ng.getWorkspaceConfig(tree);

  // FIXME : since generate can work outside of workspace verify we have a package.json
  const workspaceConf = JSON.parse(tree.read('/package.json')!.toString());
  const workspaceName = workspaceConf.name;
  // FIXME : check if wx member exists
  const workspaceRoot = workspaceConf.wx.newPackagesRoot;

  const projectPath: string = options.directory ? options.directory : DEFAULT_LIB_DIR;
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
    prefix: prefix
  };
}

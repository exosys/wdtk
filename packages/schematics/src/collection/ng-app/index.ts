import { join, normalize, Path } from '@angular-devkit/core';
import { Rule, Tree, SchematicsException, MergeStrategy } from '@angular-devkit/schematics';
import { externalSchematic, schematic, mergeWith, apply, template, url, chain, move, noop } from '@angular-devkit/schematics';
import { Schema as Options } from './schema';

import { dasherize } from '@angular-devkit/core/src/utils/strings';

import * as ng from './../../angular';
import { removeKarma } from '../../rules/karma';
import { updateKarma } from '../../rules/karma';
import { updateJsonFile } from '../../rules/update-json-file';

const DEFAULT_APP_DIR = 'app';
interface NormalizedOptions extends Options {
  newProjectRoot: string;
  ngAppProjectRoot: string;
  wxAppProjectRoot: string;
  ngE2eProjectRoot: string;
  wxE2eProjectRoot: string;
  packageName: string;
  e2eName: string;
}

export default function(options: Options): Rule {
  return (tree: Tree) => {
    const opts: NormalizedOptions = normalizeOptions(tree, options);

    const projectRoot = opts.wxAppProjectRoot;
    //prettier-ignore
    const relativePathToWorkspaceRoot = projectRoot.split('/').map(x => '..').join('/');

    const versions = { ...ng.versions };
    return chain([
      schematic('ng', { packagesRoot: opts.newProjectRoot, skipInstall: opts.skipInstall }),
      externalSchematic('@schematics/angular', 'app', opts),
      mergeWith(apply(url('./files'), [template({ ...opts, projectRoot: opts.wxAppProjectRoot, versions })]), MergeStrategy.Overwrite),

      move(opts.ngAppProjectRoot, opts.wxAppProjectRoot),
      updateWorkspaceNgConf(opts),
      updateAppProjectNgConf(opts),
      updateJsonFile(`${projectRoot}/tsconfig.app.json`, (json: any) => {
        json.extends = `${relativePathToWorkspaceRoot}/tsconfig.json`;
        json.exclude.push('**/*-spec.ts');
        json.compilerOptions.outDir = `./out/tsc`;
      }),
      updateJsonFile(`${projectRoot}/tslint.json`, (json: any) => {
        json.extends = `${relativePathToWorkspaceRoot}/tslint.json`;
      }),
      move(opts.ngE2eProjectRoot, opts.wxE2eProjectRoot),
      updateE2eProjectNgConf(opts),
      updateJsonFile(`${opts.wxE2eProjectRoot}/tsconfig.e2e.json`, (json: any) => {
        json.extends = `${relativePathToWorkspaceRoot}/../tsconfig.json`;
        json.compilerOptions.outDir = `./../out/tsc`;
      }),
      opts.unitTestRunner !== 'karma' ? removeKarma(opts.name) : updateKarma(opts.name),
      opts.unitTestRunner === 'jest' ? schematic('ng-jest', { project: opts.name, skipInstall: opts.skipInstall }) : noop()
    ]);
  };
}

function updateWorkspaceNgConf(opts: NormalizedOptions): Rule {
  return (tree: Tree) => {
    const workspaceConf = ng.getWorkspaceConfig(tree);
    if (workspaceConf.defaultProject === undefined) {
      workspaceConf.defaultProject = opts.name;
      return ng.updateWorkspaceConfig(workspaceConf);
    }
  };
}
function updateAppProjectNgConf(opts: NormalizedOptions): Rule {
  return (tree: Tree) => {
    const projectName = opts.name;
    const project = ng.getProject(projectName, tree);

    const projectRoot = normalize(opts.wxAppProjectRoot);
    project.root = projectRoot;
    project.sourceRoot = join(projectRoot, 'src');
    if (project.architect) {
      if (project.architect.build) {
        project.architect.build.options = {
          ...project.architect.build.options,
          index: join(projectRoot, 'src', 'index.html'),
          main: join(projectRoot, 'src', 'main.ts'),
          polyfills: join(projectRoot, 'src', 'polyfills.ts'),
          tsConfig: join(projectRoot, 'tsconfig.app.json'),
          //prettier-ignore
          assets: [
            join(projectRoot, 'src', 'favicon.ico'), 
            join(projectRoot, 'src', 'assets')
          ],
          styles: [join(projectRoot, 'src', 'styles.css')]
        };
        if (project.architect.build.configurations) {
          project.architect.build.configurations.production = {
            ...project.architect.build.configurations.production,
            fileReplacements: [
              {
                replace: join(projectRoot, 'src', 'environments', 'environment.ts'),
                with: join(projectRoot, 'src', 'environments', 'environment.prod.ts')
              }
            ]
          };
        }
        if (project.architect.lint) {
          project.architect.lint.options.tsConfig = [];
          project.architect.lint.options.tsConfig.push(join(projectRoot, 'tsconfig.app.json'));
          project.architect.lint.options.tsConfig.push(join(projectRoot, 'tsconfig.spec.json'));
        }
      }
    }
    return ng.updateProject(projectName, project);
  };
}
function updateE2eProjectNgConf(opts: NormalizedOptions): Rule {
  return (tree: Tree) => {
    const projectName = `${opts.e2eName}`;

    const project = ng.getProject(projectName, tree);
    const projectRoot = normalize(opts.wxE2eProjectRoot);
    //update the project's root path
    project.root = projectRoot;
    project.sourceRoot = join(projectRoot, 'src');
    if (project.architect) {
      if (project.architect.e2e) {
        project.architect.e2e.options.protractorConfig = join(projectRoot, 'protractor.conf.js');
      }
      if (project.architect.lint) {
        project.architect.lint.options.tsConfig = join(projectRoot, 'tsconfig.e2e.json');
      }
    }
    return ng.updateProject(projectName, project);
  };
}

function normalizeOptions(tree: Tree, options: Options): NormalizedOptions {
  const opts = options;

  if (!options.name) {
    throw new SchematicsException(`Invalid options, "name" is required.`);
  }

  const workspaceConf = JSON.parse(tree.read('/package.json')!.toString());
  const workspaceName = workspaceConf.name;
  const workspaceRoot = workspaceConf.wx.newPackagesRoot;

  const projectPath: string = options.directory ? dasherize(options.directory) : DEFAULT_APP_DIR;
  let projectName: string = options.name;

  let projectScope = `${workspaceName}`;

  if (/^@.*\/.*/.test(projectName)) {
    // if scope is present in the provided name, extract the scope from the name
    // to prevent the underlying schematics from failing
    let [_scope, _name] = projectName.split('/');
    projectScope = _scope.replace('@', '');
    projectName = _name;
  }
  projectName = dasherize(projectName);
  const fullProjectName = `@${projectScope}/${projectName}`;

  const appProjectName = projectName;
  const ngAppProjectRoot = `${workspaceRoot}/${projectName}`;
  const wxAppProjectRoot = `${workspaceRoot}/${projectPath}/${projectName}`;

  const e2eProjectName = `${projectName}-e2e`;
  const ngE2eProjectRoot = `${workspaceRoot}/${opts.name}-e2e`;
  const wxE2eProjectRoot = `${wxAppProjectRoot}/e2e`;

  const prefix = options.prefix ? options.prefix : projectScope;

  return {
    ...options,

    name: appProjectName,
    newProjectRoot: workspaceRoot,
    ngAppProjectRoot: ngAppProjectRoot,
    wxAppProjectRoot: wxAppProjectRoot,
    e2eName: e2eProjectName,
    ngE2eProjectRoot: ngE2eProjectRoot,
    wxE2eProjectRoot: wxE2eProjectRoot,
    packageName: fullProjectName,
    prefix: prefix
  };
}

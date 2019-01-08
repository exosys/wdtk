import { join, normalize, Path } from '@angular-devkit/core';
import { Rule, Tree, SchematicsException, MergeStrategy } from '@angular-devkit/schematics';
import { externalSchematic, schematic, mergeWith, apply, template, url, chain, move, noop } from '@angular-devkit/schematics';
import { Schema as Options } from './schema';

import { dasherize } from '@angular-devkit/core/src/utils/strings';

import * as ng from './../../angular';
import { removeKarma } from '../../rules/remove-karma';

interface NormalizedOptions extends Options {
  newProjectRoot: string;
  projectRoot: string; // make project root mandatory
  packageName: string;
  e2eName: string;
}

export default function(options: Options): Rule {
  return (tree: Tree) => {
    const opts: NormalizedOptions = normalizeOptions(tree, options);

    const projectRoot = opts.projectRoot;
    const ngE2eProjectRoot = `${projectRoot}/${opts.name}-e2e`;
    const wxE2eProjectRoot = `${projectRoot}/e2e`;

    const versions = { ...ng.versions };
    return chain([
      schematic('ng', { packagesRoot: opts.newProjectRoot, skipInstall: opts.skipInstall }),
      externalSchematic('@schematics/angular', 'app', opts),
      updateWorkspaceNgConf(opts),
      move(ngE2eProjectRoot, wxE2eProjectRoot),
      updateE2eProjectNgConfig(opts),
      mergeWith(apply(url('./files'), [template({ ...opts, versions })]), MergeStrategy.Overwrite),
      opts.unitTestRunner !== 'karma' ? removeKarma(opts.name) : noop()
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

function updateE2eProjectNgConfig(opts: NormalizedOptions): Rule {
  return (tree: Tree) => {
    const projectRoot: Path = join(normalize(opts.projectRoot), 'e2e');
    const projectName = `${opts.e2eName}`;

    const project = ng.getProject(projectName, tree);

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

  const rootPackage = JSON.parse(tree.read('/package.json')!.toString());
  const newProjectRoot = rootPackage.wx.newPackageRoot;
  const newAppProjectRoot = rootPackage.wx.appPackageRoot;

  let projectName: string = options.name;
  let scope = `${rootPackage.name}`;

  if (/^@.*\/.*/.test(projectName)) {
    // if scope is present in the provided name, extract the scope from the name
    // to prevent the underlying schematics from failing
    let [scopeName, name] = projectName.split('/');
    scope = scopeName.replace('@', '');
    projectName = name;
  }
  projectName = dasherize(projectName);
  const e2eProjectName = `${projectName}-e2e`;
  const packageName = `@${scope}/${projectName}`;

  const appDir = options.directory ? `${dasherize(options.directory)}/${projectName}` : `${projectName}`;
  const projectRoot = `${newProjectRoot}/${newAppProjectRoot}/${appDir}`;

  const prefix = options.prefix ? options.prefix : scope;

  return {
    ...options,

    name: projectName,
    newProjectRoot: newProjectRoot,
    e2eName: e2eProjectName,
    projectRoot: projectRoot,
    packageName: packageName,
    prefix: prefix
  };
}

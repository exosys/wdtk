import { join, normalize, Path, JsonException } from '@angular-devkit/core';
import { Rule, Tree, SchematicsException, schematic } from '@angular-devkit/schematics';
import { chain, mergeWith, apply, url, template } from '@angular-devkit/schematics';

import * as ng from './../../angular';
import { Schema as Options } from './schema';
import { updateJsonFile } from '../../rules/update-json-file';
import { versions } from '../../versions';

export interface NormalizedOptions extends Options {
  preset: string;
  coverageDirectory: string;
  projectRoot: string;
}

export default function(options: Options): Rule {
  return (tree: Tree) => {
    const opts: NormalizedOptions = normalizeOptions(options, tree);
    return chain([
      schematic('jest', { skipInstall: opts.skipInstall }),
      mergeWith(
        apply(url('./files'), [
          template({
            ...opts,
            conf: 'jest.config.js',
            test_ts: 'test.ts'
          })
        ])
      ),
      //import 'jest-preset-angular'; in test.js
      addDependencies(opts),
      updateProjectNgConf(opts)
    ]);
  };
}

function addDependencies(opts: NormalizedOptions): Rule {
  return (tree: Tree) => {
    return updateJsonFile(`${opts.projectRoot}/package.json`, (json: any) => {
      const t = json;
      json.devDependencies = {
        ...json.devDependencies,
        '@angular-builders/jest': `^${versions.angularBuildersJest}`
      };
      const x = json;
    });
  };
}

function updateProjectNgConf(opts: NormalizedOptions): Rule {
  return (tree: Tree) => {
    const projectRoot: Path = normalize(opts.projectRoot);
    const projectName: string = `${opts.project}`;

    const project = ng.getProject(projectName, tree);
    if (!project) {
      throw new SchematicsException(`Project '${projectName}' does not exist.`);
    }

    if (project.architect) {
      const architect: any = (<ng.WorkspaceTargets<ng.ProjectType.Library>>project).architect;
      if (architect.test) {
        delete architect.test;
      }
      architect.test = {
        builder: '@angular-builders/jest:run',
        options: {
          // main: join(projectRoot, 'src', 'test.ts'),
          // tsConfig: join(projectRoot, 'tsconfig.spec.json'),
          // jestConfig: join(projectRoot, 'jest.config.js')
        }
      };
      architect.lint.options.tsConfig.push(join(projectRoot, 'tsconfig.spec.json'));
    }
    return ng.updateProject(projectName, project);
  };
}

function normalizeOptions(options: Options, tree: Tree): NormalizedOptions {
  let projectName: string = options.project;
  const project = ng.getProject(projectName, tree);
  const projectRoot = project.root;

  //prettier-ignore
  const relativePathToWorkspaceRoot = projectRoot.split('/').map(x => '..').join('/');
  const preset = `${relativePathToWorkspaceRoot}/jest.config.js`;
  const coverageDir = `${relativePathToWorkspaceRoot}/target/test/coverage`;
  return {
    ...options,
    projectRoot: projectRoot,
    preset: preset,
    coverageDirectory: coverageDir
  };
}

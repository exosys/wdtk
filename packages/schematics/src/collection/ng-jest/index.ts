import { join, normalize, Path, JsonException } from '@angular-devkit/core';
import { Rule, Tree, SchematicsException, schematic } from '@angular-devkit/schematics';
import { chain, mergeWith, apply, url, template } from '@angular-devkit/schematics';

import * as ng from './../../angular';
import { Schema as Options } from './schema';
import { updateJsonFile } from '../../rules/update-json-file';
import { type } from 'os';

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
            conf: 'jest.config.js'
          })
        ])
      ),
      removeKarmaConfigFile(opts),
      updateJsonFile(`${opts.projectRoot}/tsconfig.spec.json`, (json: any) => {
        let types: string[] = json.compilerOptions.types;
        types.push('jest');

        json.compilerOptions.types = types.filter(type => {
          return type !== 'jasmine';
        });
      }),
      //import 'jest-preset-angular'; in test.js
      updateProjectNgConfig(opts)
    ]);
  };
}

function removeKarmaConfigFile(opts: NormalizedOptions): Rule {
  return (tree: Tree) => {
    tree.delete(`${opts.projectRoot}/karma.conf.js`);
    return tree;
  };
}

function updateProjectNgConfig(opts: NormalizedOptions): Rule {
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
        builder: '@wdtk/builders:jest',
        options: {
          main: join(projectRoot, 'src', 'test.ts'),
          tsConfig: join(projectRoot, 'tsconfig.spec.json'),
          jestConfig: join(projectRoot, 'jest.config.js')
        }
      };
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

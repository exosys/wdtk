import { join, normalize, strings, NormalizedRoot } from '@angular-devkit/core';
import {
  Rule,
  Tree,
  chain,
  externalSchematic,
  move,
  mergeWith,
  apply,
  template,
  url,
  SchematicsException,
  MergeStrategy
} from '@angular-devkit/schematics';
import { getWorkspace, updateWorkspace } from '@schematics/angular/utility/config';
import { getProject } from '@schematics/angular/utility/project';
import { Schema as Options } from './schema';
import { toFileName } from './../../util/string';
import { updateJsonInTree } from '../../util/json';
import * as project from '../../util/project';
import { latestVersions } from '@schematics/angular/utility/latest-versions';

interface NormalizedOptions extends Options {
  appProjectRoot: string;
  e2eProjectName: string;
  e2eProjectRoot: string;
  parsedTags: string[];
}

export default function(opts: Options): Rule {
  return (tree: Tree) => {
    opts = normalizeOptions(tree, opts);

    const workspace = getWorkspace(tree);
    const newProjectRoot = workspace.newProjectRoot;

    const appProjectRoot = newProjectRoot ? `${newProjectRoot}/${opts.name}` : `${opts.name}`;
    const e2eProjectRoot = newProjectRoot ? `${newProjectRoot}/${(<NormalizedOptions>opts).e2eProjectName}` : `e2e`;

    const versions = {
      ...latestVersions
    };
    return chain([
      externalSchematic('@schematics/angular', 'app', opts),
      move(appProjectRoot, (<NormalizedOptions>opts).appProjectRoot),
      updateAppProject(<NormalizedOptions>opts),
      move(e2eProjectRoot, (<NormalizedOptions>opts).e2eProjectRoot),
      updateE2eProject(<NormalizedOptions>opts),
      mergeWith(
        apply(url('./files'), [
          template({
            utils: strings,
            ...(opts as any),
            path: (<NormalizedOptions>opts).appProjectRoot,
            versions,
            scope: project.getScope(tree)
          })
        ]),
        MergeStrategy.Overwrite
      )
    ]);
  };
}

function updateAppProject(opts: NormalizedOptions): Rule {
  return chain([
    (tree: Tree) => {
      const workspace = getWorkspace(tree);
      let project = getProject(workspace, opts.name);

      if (!project) {
        throw new SchematicsException(`Project '${opts.name}' does not exist.`);
      }
      const projectRoot = opts.appProjectRoot;
      project.root = projectRoot;
      project.sourceRoot = join(normalize(projectRoot), 'src');

      if (project.architect !== undefined) {
        if (project.architect.build) {
          project.architect.build.options.index = join(normalize(project.sourceRoot), 'index.html');
          project.architect.build.options.main = join(normalize(project.sourceRoot), 'main.ts');
          project.architect.build.options.polyfills = join(normalize(project.sourceRoot), 'polyfills.ts');
          project.architect.build.options.tsConfig = join(normalize(projectRoot), 'tsconfig.app.json');
          project.architect.build.options.assets = [
            join(normalize(project.sourceRoot), 'favicon.ico'),
            join(normalize(project.sourceRoot), 'assets')
          ];
          project.architect.build.options.styles = [join(normalize(project.sourceRoot), `styles.${opts.style}`)];

          if (project.architect.build.configurations) {
            project.architect.build.configurations.production.fileReplacements = [
              {
                replace: join(normalize(project.sourceRoot), 'environments', 'environment.ts'),
                with: join(normalize(project.sourceRoot), 'environments', 'environment.prod.ts')
              }
            ];
          }
        }

        if (project.architect.test) {
          project.architect.test.options.main = join(normalize(project.sourceRoot), 'test.ts');
          project.architect.test.options.polyfills = join(normalize(project.sourceRoot), 'polyfills.ts');
          project.architect.test.options.tsConfig = join(normalize(projectRoot), 'tsconfig.spec.json');
          project.architect.test.options.karmaConfig = join(normalize(projectRoot), 'karma.conf.js');
          project.architect.test.options.assets = [
            join(normalize(project.sourceRoot), 'favicon.ico'),
            join(normalize(project.sourceRoot), 'assets')
          ];
          project.architect.test.options.styles = [join(normalize(project.sourceRoot), `styles.${opts.style}`)];
        }

        if (project.architect.lint) {
          project.architect.lint.options.tsConfig = [
            join(normalize(projectRoot), 'tsconfig.app.json'),
            join(normalize(projectRoot), 'tsconfig.spec.json')
          ];
        }
      }
      workspace.projects[opts.name] = project;
      return updateWorkspace(workspace);
    },
    updateJsonInTree(`${opts.appProjectRoot}/tsconfig.app.json`, json => {
      let exclude = json.exclude;
      exclude.push('**/*-spec.ts');
      return {
        ...json,
        extends: `${project.relativeOffsetFromWorkspaceRoot(opts.appProjectRoot)}tsconfig.json`,
        compilerOptions: {
          ...json.compilerOptions,
          outDir: `${project.relativeOffsetFromWorkspaceRoot(opts.appProjectRoot)}dist/out-tsc/${opts.appProjectRoot}`
        },

        exclude: exclude
      };
    }),

    updateJsonInTree(`${opts.appProjectRoot}/tsconfig.spec.json`, json => {
      return {
        ...json,
        extends: `${project.relativeOffsetFromWorkspaceRoot(opts.appProjectRoot)}tsconfig.json`,
        compilerOptions: {
          ...json.compilerOptions,
          outDir: `${project.relativeOffsetFromWorkspaceRoot(opts.appProjectRoot)}dist/out-tsc/${opts.appProjectRoot}`
        }
      };
    })
  ]);
}

function updateE2eProject(opts: NormalizedOptions): Rule {
  return chain([
    (tree: Tree) => {
      const workspace = getWorkspace(tree);
      let project = getProject(workspace, opts.e2eProjectName);

      if (!project) {
        throw new SchematicsException(`Project '${opts.name}' does not exist.`);
      }
      const projectRoot = opts.e2eProjectRoot;
      project.root = projectRoot;
      project.sourceRoot = join(normalize(projectRoot), 'src');

      if (project.architect !== undefined) {
        if (project.architect.e2e) {
          project.architect.e2e.options.protractorConfig = join(normalize(projectRoot), 'protractor.conf.js');
        }
        if (project.architect.lint) {
          project.architect.lint.options.tsConfig = [join(normalize(projectRoot), 'tsconfig.e2e.json')];
        }
      }
      workspace.projects[opts.e2eProjectName] = project;
      return updateWorkspace(workspace);
    },
    updateJsonInTree(`${opts.e2eProjectRoot}/tsconfig.e2e.json`, json => {
      return {
        ...json,
        extends: `${project.relativeOffsetFromWorkspaceRoot(opts.e2eProjectRoot)}tsconfig.json`
      };
    })
  ]);
}

function normalizeOptions(tree: Tree, opts: Options): NormalizedOptions {
  const appDir = opts.directory ? `${toFileName(opts.directory)}/${toFileName(opts.name)}` : `${toFileName(opts.name)}`;

  const prefix = opts.prefix ? `${opts.prefix}` : project.getScope(tree);
  const workspace = getWorkspace(tree);
  const newProjectRoot = workspace.newProjectRoot;

  const appProjectName = appDir.replace(new RegExp('/', 'g'), '-');
  const appProjectRoot = `${newProjectRoot}/app/${appDir}`;

  const e2eProjectName = `${appProjectName}-e2e`;
  const e2eProjectRoot = `${newProjectRoot}/app/${appDir}/e2e`;

  return {
    ...opts,
    appProjectRoot: appProjectRoot,
    e2eProjectName: e2eProjectName,
    e2eProjectRoot: e2eProjectRoot,
    parsedTags: [],
    prefix: prefix,
    skipInstall: true,
    skipPackageJson: true
  };
}

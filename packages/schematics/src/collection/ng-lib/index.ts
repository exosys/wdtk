import { Rule, Tree, SchematicContext, chain, externalSchematic, move, SchematicsException } from '@angular-devkit/schematics';
import { Schema as Options } from './schema';
import * as project from '../../util/project';
import { toFileName } from '../../util/string';
import { getWorkspace, updateWorkspace } from '@schematics/angular/utility/config';
import { getProject } from '@schematics/angular/utility/project';
import { join, normalize, strings } from '@angular-devkit/core';
import { updateJsonInTree } from '../../util/json';

import { ProjectType, WorkspaceProject } from '@schematics/angular/utility/workspace-models';
import { updateJsonFile } from '../../rules/updateJsonFile';

interface NormalizedOptions extends Options {
  name: string;
  //  / fileName: string;
  libProjectRoot: string;
  entryFile: string;
  skipInstall: boolean;
  skipPackageJson: boolean;
  skipTsConfig: boolean;
}

// name: options.name,
// prefix: options.prefix,
// style: options.style,
// entryFile: 'index',
// skipPackageJson: !options.publishable,
// skipTsConfig: true

export default function(options: Options): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const opts = normalizeOptions(tree, options);

    const workspace = getWorkspace(tree);
    const newProjectRoot = workspace.newProjectRoot;
    // const libProjectRoot = newProjectRoot ? `${newProjectRoot}/${opts.name}` : `${opts.name}`;
    let libDirName: string;
    if (/^@.*\/.*/.test(options.name)) {
      const [scope, name] = options.name.split('/');

      const scopeDir = strings.dasherize(scope.replace(/^@/, ''));
      libDirName = `${scopeDir}/${strings.dasherize(name)}`;
    } else {
      libDirName = `${opts.name}`;
    }

    const libProjectRoot = newProjectRoot ? `${newProjectRoot}/${libDirName}` : `${libDirName}`;

    return chain([
      externalSchematic('@schematics/angular', 'library', opts),
      move(libProjectRoot, opts.libProjectRoot),
      updateProject(opts),
      updateRootTsConfig(opts)
    ]);
  };
}
function updateRootTsConfig(opts: NormalizedOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return updateJsonFile('/tsconfig.json', (json: any) => {
      const compilerOptions = json.compilerOptions;
      if (compilerOptions.paths) {
        if (compilerOptions.paths[opts.name]) {
          delete compilerOptions.paths[opts.name];
        }
      } else {
        compilerOptions.paths = {};
      }
      compilerOptions.paths[opts.name] = [`${opts.libProjectRoot}/src/index.ts`];
    });
  };
}
function updateProject(opts: NormalizedOptions): Rule {
  // const relativePathToWorkspaceRoot = projectRoot.split('/').map(x => '..').join('/');
  return chain([
    (tree: Tree, context: SchematicContext) => {
      const workspace = getWorkspace(tree);
      let project: WorkspaceProject<ProjectType.Library> = getProject(workspace, opts.name);
      if (!project) {
        throw new SchematicsException(`Project '${opts.name}' does not exist.`);
      }
      const projectRoot = opts.libProjectRoot;
      project.root = projectRoot;
      project.sourceRoot = join(normalize(projectRoot), 'src');
      if (project.architect !== undefined) {
        if (project.architect.build) {
          project.architect.build.options.tsConfig = join(normalize(projectRoot), 'tsconfig.lib.json');
          project.architect.build.options.project = join(normalize(projectRoot), 'ng-package.json');
        }
        if (project.architect.test) {
          project.architect.test.options.main = join(normalize(project.sourceRoot), 'test.ts');
          project.architect.test.options.tsConfig = join(normalize(projectRoot), 'tsconfig.spec.json');
          project.architect.test.options.karmaConfig = join(normalize(projectRoot), 'karma.conf.js');
        }
        if (project.architect.lint) {
          project.architect.lint.options.tsConfig = [
            join(normalize(projectRoot), 'tsconfig.app.json'),
            join(normalize(projectRoot), 'tsconfig.spec.json')
          ];
        }
      }
      //FIXME: replace the scope qualified project name with the unqualified name if the scope matches
      //the default scope (workspace name)

      workspace.projects[opts.name] = project;
      return updateWorkspace(workspace);
    },
    updateJsonFile(`${opts.libProjectRoot}/tsconfig.lib.json`, (json: any) => {
      json.extends = `${project.relativeOffsetFromWorkspaceRoot(opts.libProjectRoot)}tsconfig.json`;
      json.exclude.push('**/*-spec.ts');
      json.compilerOptions.outDir = `${project.relativeOffsetFromWorkspaceRoot(opts.libProjectRoot)}dist/out-tsc/${opts.libProjectRoot}`;
    }),
    updateJsonFile(`${opts.libProjectRoot}/tsconfig.spec.json`, (json: any) => {
      json.extends = `${project.relativeOffsetFromWorkspaceRoot(opts.libProjectRoot)}tsconfig.json`;
      json.compilerOptions.outDir = `${project.relativeOffsetFromWorkspaceRoot(opts.libProjectRoot)}dist/out-tsc/${opts.libProjectRoot}`;
    })
  ]);
}
function normalizeOptions(tree: Tree, options: Options): NormalizedOptions {
  let scopeName: string = project.getScope(tree);

  let libDir: string;
  if (/^@.*\/.*/.test(options.name)) {
    const [scope, name] = options.name.split('/');
    scopeName = scope.replace(/^@/, '');
    libDir = toFileName(name);
  } else {
    libDir = toFileName(options.name);
    options.name = `@${scopeName}/${options.name}`;
  }

  const prefix = options.prefix ? `${options.prefix}` : scopeName;

  const workspace = getWorkspace(tree);
  const newProjectRoot = workspace.newProjectRoot;

  const name = toFileName(options.name);

  //FIXME replace hardcoded lib with the value read from root package.json
  const libProjectRoot = `${newProjectRoot}/lib/${libDir}`;

  return {
    ...options,
    name: name,
    libProjectRoot: libProjectRoot,
    prefix: prefix,
    style: options.style,
    entryFile: 'index',
    skipTsConfig: true,
    skipPackageJson: false,
    skipInstall: true
  };
}

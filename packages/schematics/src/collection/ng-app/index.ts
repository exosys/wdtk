import { join, normalize } from '@angular-devkit/core';
import { Rule, Tree, chain, externalSchematic, move, SchematicsException } from '@angular-devkit/schematics';
import { getWorkspace, updateWorkspace } from '@schematics/angular/utility/config';
import { getProject } from '@schematics/angular/utility/project';
import { Schema as Options } from './schema';
import { toFileName } from './../../util/string';

interface NormalizedOptions extends Options {
  appProjectRoot: string;
  e2eProjectName: string;
  e2eProjectRoot: string;
  parsedTags: string[];
}

export default function(opts: Options): Rule {
  
  return (tree: Tree) => {
    console.error('here');
    opts = normalizeOptions(tree, opts);

    const workspace = getWorkspace(tree);
    const newProjectRoot = workspace.newProjectRoot;

    const appProjectRoot = newProjectRoot ? `${newProjectRoot}/${opts.name}` : `${opts.name}`;
    const e2eProjectRoot = newProjectRoot ? `${newProjectRoot}/${(<NormalizedOptions>opts).e2eProjectName}` : `e2e`;

    return chain([
      externalSchematic('@schematics/angular', 'app', opts),
      move(appProjectRoot, (<NormalizedOptions>opts).appProjectRoot),
      updateAppProject(<NormalizedOptions>opts),
      move(e2eProjectRoot, (<NormalizedOptions>opts).e2eProjectRoot),
      updateE2eProject(<NormalizedOptions>opts)
    ]);
  };
}

function updateAppProject(opts: NormalizedOptions): Rule {
  return (tree: Tree) => {
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
  };
}

function updateE2eProject(opts: NormalizedOptions): Rule {
  return (tree: Tree) => {
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
  };
}

function normalizeOptions(tree: Tree, opts: Options): NormalizedOptions {
  const appDir = opts.directory ? `${toFileName(opts.directory)}/${toFileName(opts.name)}` : `${toFileName(opts.name)}`;

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
    skipInstall: true,
    skipPackageJson: false
  };
}

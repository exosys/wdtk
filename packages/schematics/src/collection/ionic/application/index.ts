import {
  Rule,
  Tree,
  SchematicContext,
  SchematicsException,
  MergeStrategy,
  branchAndMerge,
  FilterHostTree,
  HostCreateTree
} from '@angular-devkit/schematics';
import { chain, move, mergeWith, apply, url, template, schematic, noop } from '@angular-devkit/schematics';
import { join, normalize, virtualFs, resolve } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { classify } from '@angular-devkit/core/src/utils/strings';
import { NodeDependencyType, addPackageJsonDependency } from '@schematics/angular/utility/dependencies';
import { Schema as Options } from './schema';
import { updateJsonFile } from '../../../rules/update-json-file';
import * as ng from './../../../angular';
import * as wdtk from './../../../versions';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
export interface NormalizedOptions extends Options {
  prefix: string;
  sourceRoot: string;

  // projectPath: string;
}

export default function(options: Options): Rule {
  return (tree: Tree) => {
    // options.style
    return chain([
      schematic('ng-app', options), // first generate the angular application
      applyChanges(options)
    ]);
  };
}

function applyChanges(options: Options): Rule {
  return (tree: Tree) => {
    const opts = normalizeOptions(options, tree);
    const templateSource = apply(url('./files/src'), [template({ ...opts, classify: classify }), move(opts.sourceRoot)]);
    return chain([
      mergeWith(templateSource, MergeStrategy.Overwrite),
      removeOrphanFiles(opts),
      branchAndMerge(addDependencies(opts)),
      updateProjectNgConf(opts)
    ]);
  };
}

function updateProjectNgConf(opts: NormalizedOptions): Rule {
  return (tree: Tree) => {
    const projectName = opts.name;
    const project = ng.getProject(projectName, tree);
    const projectSourceRoot = normalize(project.sourceRoot!);
    //prettier-ignore
    const relativePathToWorkspaceRoot = project.root.split('/').map(x => '..').join('/');
    if (project.architect) {
      if (project.architect.build) {
        project.architect.build.options = {
          ...project.architect.build.options,
          //prettier-ignore
          assets: [
            {
              "glob": "**/*",
              "input": join(projectSourceRoot, 'assets'),
              "output": "assets"
            },
            {
              "glob": "**/*.svg",
              "input": `${relativePathToWorkspaceRoot}/node_modules/ionicons/dist/ionicons/svg`,
              "output": "./svg"
            }
          ],
          //prettier-ignore
          styles: [
            join(projectSourceRoot, 'global.scss').toString(), 
            join(projectSourceRoot, 'theme', 'variables.scss')
          ]
        };
      }
    }
    return ng.updateProject(projectName, project);
  };
}

function removeOrphanFiles(opts: NormalizedOptions): Rule {
  return (tree: Tree) => {
    const sourceRoot = normalize(opts.sourceRoot);
    tree.delete(join(sourceRoot, `favicon.ico`));
    tree.delete(join(sourceRoot, `styles.${opts.style}`));
    return tree;
  };
}

function addDependencies(opts: NormalizedOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // const packageJsonSource: any = url('d:/work/opfx/proj/wdtk/work/sample/pkg/app/www')(context);
    // const projectRoot = normalize(resolve(projectRoot, url.path || ''));
    const project = ng.getProject(opts.name, tree);
    const p = normalize(project.root);
    const projectRoot = normalize(resolve(tree.root.path, p));
    // const projectTree = new HostCreateTree(new virtualFs.ScopedHost(new NodeJsSyncHost(), projectRoot));
    const projectTree = new HostCreateTree(new virtualFs.ScopedHost(tree., projectRoot));
    const versions = { ...ng.versions, ...wdtk.versions };
    [{ type: NodeDependencyType.Dev, name: '@ionic/angular-toolkit', version: `~${versions.ionicAngularToolkit}` }].forEach(dependency => {
      addPackageJsonDependency(projectTree, dependency);
    });
    if (!opts.skipInstall) {
      context.addTask(new NodePackageInstallTask());
    }
    return tree;
  };
}

function addDependenciesx(opts: NormalizedOptions): Rule {
  return (tree: Tree) => {
    const versions = { ...ng.versions, ...wdtk.versions };
    // return updateJsonFile(`${opts.projectPath}/package.json`, (json: any) => {
    //   json.dependencies = {
    //     ...json.dependencies,
    //     '@ionic/angular': `${versions.ionicAngular}`,
    //     '@ionic-native/core': `${versions.ionicNative}`,
    //     '@ionic-native/splash-screen': `${versions.ionicNative}`,
    //     '@ionic-native/status-bar': `${versions.ionicNative}`
    //   };
    //   json.devDependencies = {
    //     ...json.devDependencies,
    //     '@ionic/angular-toolkit': `${versions.ionicAngularToolkit}`
    //   };
    // });
  };
}

function normalizeOptions(options: Options, tree: Tree): NormalizedOptions {
  const projectName: string = options.name;

  const project = ng.getProject(projectName, tree);

  // const projectPath = project.root;
  const sourceRoot = project.sourceRoot;
  const prefix = project.prefix;
  // const projectType = project.projectType;
  // if (projectType !== 'application') {
  //   throw new SchematicsException(`Cannot add 'ionic' support to '${projectName}'(not an application).`);
  // }
  return {
    ...options,
    prefix: prefix,
    sourceRoot: project.sourceRoot!

    // projectPath: projectPath
  };
}

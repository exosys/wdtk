import { join, normalize, Path } from '@angular-devkit/core';
import { strings } from '@angular-devkit/core';
import { Rule, Tree, SchematicContext, MergeStrategy, SchematicsException } from '@angular-devkit/schematics';
import { chain, move, mergeWith, apply, url, template, schematic } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import { Schema as Options } from './schema';
import * as ng from '../../../core/ng';
import * as wdtk from './../../../versions';
import { NodeDependencyType, addProjectDependencies } from './../../../core/dependencies';

import { insertImport, addSymbolToNgModuleMetadata } from '@schematics/angular/utility/ast-utils';
import * as ts from '../../../core/ts';
import { Change, InsertChange } from '@schematics/angular/utility/change';

export interface NormalizedOptions extends Options {
  prefix: string;
  sourceRoot: string;
  projectRoot: string;
  // selector: string;
}

export default function(options: Options): Rule {
  return (tree: Tree) => {
    return chain([
      schematic('ng-app', options), // first generate the angular application
      applyChanges(options),
      schematic('page', { project: options.name }) // add the home page
    ]);
  };
}

function applyChanges(options: Options): Rule {
  return (tree: Tree) => {
    const opts = normalizeOptions(options, tree);
    const templateSource = apply(url('./files/src'), [template({ ...opts, classify: strings.classify }), move(opts.sourceRoot)]);
    return chain([
      mergeWith(templateSource, MergeStrategy.Overwrite),
      addDependencies(opts),
      updateProjectNgConf(opts),
      updateProjectSources(opts),
      updateProjectResources(opts)
    ]);
  };
}

function updateProjectSources(opts: NormalizedOptions): Rule {
  return (tree: Tree) => {
    const changes: Change[] = [];
    const appModulePath: Path = ng.findModule(tree, `${opts.sourceRoot}/app`);
    const source = ts.getSourceFile(tree, appModulePath);
    const recorder = tree.beginUpdate(appModulePath);

    const modulesToImport = [
      { symbolName: 'RouteReuseStrategy', fileName: '@angular/router' },
      { symbolName: 'IonicModule, IonicRouteStrategy', fileName: '@ionic/angular' },
      { symbolName: 'SplashScreen', fileName: '@ionic-native/splash-screen/ngx' },
      { symbolName: 'StatusBar', fileName: '@ionic-native/status-bar/ngx' }
    ];
    modulesToImport.forEach(module => {
      const change: Change = insertImport(source, appModulePath, module.symbolName, module.fileName);
      if (change) {
        changes.push(change);
      }
    });

    const metadataChanges = [
      { field: 'imports', symbolName: 'IonicModule.forRoot()' },
      { field: 'providers', symbolName: 'StatusBar,' },
      { field: 'providers', symbolName: 'SplashScreen,' },
      { field: 'providers', symbolName: '{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }' }
    ];
    metadataChanges.forEach(metadataChange => {
      addSymbolToNgModuleMetadata(source, appModulePath, metadataChange.field, metadataChange.symbolName).forEach(change => {
        changes.push(change);
      });
    });

    //perform the changes
    changes.forEach(change => {
      if (change instanceof InsertChange) {
        recorder.insertLeft(change.pos, change.toAdd);
      }
    });

    tree.commitUpdate(recorder);
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

function updateProjectResources(opts: NormalizedOptions): Rule {
  return (tree: Tree) => {
    const sourceRoot = normalize(opts.sourceRoot);
    tree.delete(join(sourceRoot, `favicon.ico`));
    tree.delete(join(sourceRoot, `styles.${opts.style}`));
    return tree;
  };
}

function addDependencies(opts: NormalizedOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const versions = { ...ng.versions, ...wdtk.versions };
    addProjectDependencies(tree, opts.projectRoot, [
      { type: NodeDependencyType.Default, name: '@ionic-native/core', version: `${versions.ionicNative}` },
      { type: NodeDependencyType.Default, name: '@ionic-native/splash-screen', version: `${versions.ionicNative}` },
      { type: NodeDependencyType.Default, name: '@ionic-native/status-bar', version: `${versions.ionicNative}` },
      { type: NodeDependencyType.Default, name: '@ionic/angular', version: `${versions.ionicAngular}` },
      { type: NodeDependencyType.Dev, name: '@ionic/angular-toolkit', version: `~${versions.ionicAngularToolkit}` }
    ]);

    if (!opts.skipInstall) {
      context.addTask(new NodePackageInstallTask());
    }
    return tree;
  };
}

function normalizeOptions(options: Options, tree: Tree): NormalizedOptions {
  const projectName: string = options.name;

  const project = ng.getProject(projectName, tree);
  const prefix = project.prefix;
  const projectType = project.projectType;

  if (projectType !== 'application') {
    throw new SchematicsException(`Cannot add 'ionic' support to '${projectName}'(not an application).`);
  }

  // let selector = `${prefix}-${strings.dasherize(options.name)}`;

  return {
    ...options,
    prefix: prefix,
    projectRoot: project.root,
    sourceRoot: project.sourceRoot!
  };
}

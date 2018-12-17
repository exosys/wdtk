import { Rule, Tree, chain, externalSchematic, move } from '@angular-devkit/schematics';
import { parseJsonAst, JsonAstObject, parseJson, JsonParseMode, JsonAstString } from '@angular-devkit/core';
import { findPropertyInAstObject } from '@schematics/angular/utility/json-utils';
import { Schema as Options } from './schema';
import { toFileName } from './../../util/string';
import { getWorkspace } from '@schematics/angular/utility/config';

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
      move(e2eProjectRoot, (<NormalizedOptions>opts).e2eProjectRoot)
    ]);
  };
}

function updateAppProject(opts: NormalizedOptions): Rule {
  return (tree: Tree) => {
    //see updateWorkspace(workspace: WorkspaceSchema): Rule;
    let workspace = getWorkspace(tree);
    let t = workspace.projects['sample'];
    // tree.beginUpdate();
    t.root = 'sample2';
  };
}

function updateAppProjectx(opts: NormalizedOptions): Rule {
  return (tree: Tree) => {
    const packageJsonAst = readPackageJson(tree);
    const t = findPropertyInAstObject(packageJsonAst, 'projects');
    const x = findPropertyInAstObject(<JsonAstObject>t!, 'sample');
    const y = findPropertyInAstObject(<JsonAstObject>x!, 'root');

    const recorder = tree.beginUpdate('angular.json');
    const { end, start } = <JsonAstString>y;
    recorder.remove(start.offset, end.offset - start.offset);
    recorder.insertRight(start.offset, JSON.stringify('sample'));
    tree.commitUpdate(recorder);
  };
}

function readPackageJson(tree: Tree): JsonAstObject {
  const buffer = tree.read('angular.json');
  if (buffer === null) {
    //FIXME
    throw new Error();
    debugger;
  }

  const content = buffer.toString();

  const packageJson = parseJsonAst(content, JsonParseMode.Strict);
  if (packageJson.kind != 'object') {
    //FIXME
    throw new Error('Invalid package.json. Was expecting an object');
  }
  return packageJson;
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
    skipPackageJson: true
  };
}

import { Rule, Tree, chain, externalSchematic, move } from '@angular-devkit/schematics';
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
      move(e2eProjectRoot, (<NormalizedOptions>opts).e2eProjectRoot)
    ]);
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
    skipPackageJson: true
  };
}

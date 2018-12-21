import { Rule, Tree, SchematicContext, chain, externalSchematic, move, noop } from '@angular-devkit/schematics';
import { Schema as Options } from './schema';
import * as project from '../../util/project';
import { toFileName } from '../../util/string';
import { getWorkspace } from '@schematics/angular/utility/config';

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
    return chain([externalSchematic('@schematics/angular', 'library', opts), move(opts.name, opts.libProjectRoot), updateProject(opts)]);
  };
}

function updateProject(opts: NormalizedOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const libRoot = `${opts.libProjectRoot}/src/lib`;
    return chain([noop()]);
  };
}
function normalizeOptions(tree: Tree, options: Options): NormalizedOptions {
  const libDir = options.directory ? `${toFileName(options.directory)}` : `${toFileName(options.name)}`;
  const prefix = options.prefix ? `${options.prefix}` : project.getScope(tree);

  const workspace = getWorkspace(tree);
  const newProjectRoot = workspace.newProjectRoot;

  const name = toFileName(options.name);

  const libProjectName = libDir.replace(new RegExp('/', 'g'), '-');
  const libProjectRoot = `${newProjectRoot}lib/${libDir}`;

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

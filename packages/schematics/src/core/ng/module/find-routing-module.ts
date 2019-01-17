import { Tree, DirEntry, SchematicsException } from '@angular-devkit/schematics';
import { Path, strings } from '@angular-devkit/core';
import { join, normalize } from '@angular-devkit/core';
import { ModuleOptions } from '@schematics/angular/utility/find-module';

const MODULE_EXT = '.module.ts';
const ROUTING_MODULE_EXT = '-routing.module.ts';

export function findRoutingModule(tree: Tree, generateDir: string, routingModuleExt: string = ROUTING_MODULE_EXT): Path {
  let dir: DirEntry | null = tree.getDir(`/${generateDir}`);
  while (dir) {
    const routingModules = dir.subfiles.filter(fileName => fileName.endsWith(routingModuleExt));
    if (routingModules.length === 1) {
      return join(dir.path, routingModules[0]);
    }
    if (routingModules.length > 1) {
      throw new SchematicsException(
        `More than one module matches. Use '--skip-import' option to skip importing ` + `the component into the closest module.`
      );
    }
    dir = dir.parent;
  }
  throw new SchematicsException(`Could not find a routing NgModule. Use the '--skip-import' option to skip importing in NgModule.`);
}

export function findRoutingModuleFromOptions(tree: Tree, options: ModuleOptions): Path {
  if (!options.module) {
    const generateDir = (options.path || '') + (options.flat ? '' : '/') + strings.dasherize(options.name);
    return findRoutingModule(tree, generateDir);
  }
  const modulePath = normalize(`/${options.path}/${options.module}`);
  const moduleBaseName = modulePath.split('/').pop();
  if (tree.exists(modulePath)) {
    return modulePath;
  }
  if (tree.exists(`${modulePath}.ts`)) {
    return normalize(`${modulePath}.ts`);
  }
  if (tree.exists(`${modulePath}.module.ts`)) {
    return normalize(`${modulePath}.module.ts`);
  }
  if (tree.exists(`${modulePath}/${moduleBaseName}.module.ts`)) {
    return normalize(`${modulePath}/${moduleBaseName}.module.ts`);
  }
  throw new SchematicsException(`Failed to locate '${options.name}' module.`);
}

import { strings } from '@angular-devkit/core';
import { Rule, Tree, SchematicContext, SchematicsException, noop, branchAndMerge, filter } from '@angular-devkit/schematics';
import { chain, mergeWith, apply, url, template, move } from '@angular-devkit/schematics';
import { parseName } from '@schematics/angular/utility/parse-name';

import { buildDefaultPath } from '@schematics/angular/utility/project';
import { validateHtmlSelector, validateName } from '@schematics/angular/utility/validation';
import { Schema as Options } from './schema';
import * as ng from '../../../core/ng';
import * as ts from 'typescript';
import { getSourceFile, updateSourceFile } from './../../../util/typescript';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { InsertChange } from '@schematics/angular/utility/change';
export interface NormalizedOptions extends Options {
  selector: string;
  path: string;
}
export default function(options: Options): Rule {
  return (tree: Tree) => {
    const opts: NormalizedOptions = normalizeOptions(options, tree);
    validateName(opts.name);
    validateHtmlSelector(opts.selector);

    const templateSource = apply(url('./files'), [
      opts.skipTests ? noop() : filter(path => !path.endsWith('.spec.ts')),
      //prettier-ignore
      template({ 
        ...strings, 
        'if-flat': (s: string) => (opts.flat ? '' : s), 
        ...opts }),
      move(opts.path)
    ]);

    // prettier-ignore
    return chain([
      branchAndMerge(
        chain([
          updateRoutes(opts), 
          mergeWith(templateSource)
        ]))]);
  };
}
function updateRoutes(opts: NormalizedOptions): Rule {
  if (opts.skipImport) {
    return noop();
  }
  return (tree: Tree) => {
    const routingModulePath = ng.findRoutingModuleFromOptions(tree, opts);
    const routingModuleSource = getSourceFile(tree, routingModulePath);

    const path = `/${opts.path}/` + (opts.flat ? '' : `${strings.dasherize(opts.name)}/`) + `${strings.dasherize(opts.name)}.module`;
    const relativePath = buildRelativePath(routingModulePath, path);
    const routePath = strings.dasherize(opts.routePath ? opts.routePath : opts.name);
    const routeLoadChildren = `${relativePath}#${strings.classify(opts.name)}PageModule`;

    const changes = ng.addRouteToModule(routingModuleSource, routePath, routeLoadChildren);
    updateSourceFile(tree, routingModuleSource, changes);
  };
}
function normalizeOptions(options: Options, tree: Tree): NormalizedOptions {
  const project = ng.getProject(options.project, tree);

  let name = strings.dasherize(options.name);
  let path = buildDefaultPath(project);

  const parsedPath = parseName(path, name);
  name = parsedPath.name;
  path = parsedPath.path;

  let selector = options.selector ? options.selector : buildSelector(options, project.prefix);

  return {
    ...options,
    selector: selector,
    path: path,
    name: name
  };
}

function buildSelector(options: Options, projectPrefix: string) {
  let selector = strings.dasherize(options.name);

  if (options.prefix) {
    selector = `${options.prefix}-${selector}`;
  } else if (options.prefix === undefined && projectPrefix) {
    selector = `${projectPrefix}-${selector}`;
  }

  return selector;
}

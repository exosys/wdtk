import { strings } from '@angular-devkit/core';
import { Rule, Tree, SchematicContext, SchematicsException, MergeStrategy, noop, branchAndMerge, filter } from '@angular-devkit/schematics';
import { chain, mergeWith, apply, url, template, move } from '@angular-devkit/schematics';
import { parseName } from '@schematics/angular/utility/parse-name';
import { buildDefaultPath } from '@schematics/angular/utility/project';
import { validateHtmlSelector, validateName } from '@schematics/angular/utility/validation';
import { Schema as Options } from './schema';
import * as ng from '../../../core/ng';
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
  return (tree: Tree) => {};
}
function normalizeOptions(options: Options, tree: Tree): NormalizedOptions {
  try {
    const project = ng.getProject(options.project, tree);

    let pageName = strings.dasherize(options.name);
    let pagePath = buildDefaultPath(project);
    const parsedPath = parseName(pagePath, pageName);
    pageName = parsedPath.name;
    pagePath = parsedPath.path;
    let selector = options.selector ? options.selector : buildSelector(options, project.prefix);

    return {
      ...options,
      selector: selector,
      path: pagePath,
      name: pageName
    };
  } catch (e) {
    const c = e;
    throw e;
  }
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

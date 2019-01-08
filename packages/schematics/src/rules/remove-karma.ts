import { Rule, Tree } from '@angular-devkit/schematics';
import { join, normalize, Path } from '@angular-devkit/core';
import * as ng from './../angular';
import * as path from 'path';

export function removeKarma<T>(projectName: string): Rule {
  return (tree: Tree) => {
    const project = ng.getProject(projectName, tree);
    if (!project) {
      return tree;
    }
    const projectRoot = normalize(project.root);
    let projectSourceRoot = join(projectRoot, 'src');
    if (project.sourceRoot) {
      projectSourceRoot = normalize(project.sourceRoot);
    }
    tree.delete(join(projectRoot, 'karma.conf.js'));
    tree.delete(join(projectRoot, 'tsconfig.spec.json'));
    tree.delete(join(projectSourceRoot, 'test.ts'));
    if (project.architect) {
      const architect: any = project.architect;

      if (architect.test) {
        delete project.architect.test;
      }
      if (architect.lint) {
        const pathToRemove = join(projectRoot, 'tsconfig.spec.json');
        (<any>project.architect.lint).options.tsConfig = (<any>project.architect.lint).options.tsConfig.filter((path: any) => {
          return path !== pathToRemove;
        });
      }
    }

    return ng.updateProject(projectName, project);
  };
}

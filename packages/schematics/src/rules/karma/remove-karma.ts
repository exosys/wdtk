import { Rule, Tree, chain } from '@angular-devkit/schematics';
import { join, normalize, DependencyNotFoundException } from '@angular-devkit/core';
import * as ng from './../../angular';
import { updateJsonFile } from './../update-json-file';

export function removeKarma<T>(projectName: string): Rule {
  return (tree: Tree) => {
    return chain([
      (tree: Tree) => {
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
      },
      removeDependencies(projectName)
    ]);
  };
}

function updateProjectNgConf(projectName: string): Rule {
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

function removeDependencies(projectName: string): Rule {
  return (tree: Tree) => {
    const project = ng.getProject(projectName, tree);
    if (!project) {
      return tree;
    }
    const projectRoot = normalize(project.root);
    return updateJsonFile(`${projectRoot}/package.json`, (json: any) => {
      let devDependencies = json.devDependencies;
      Object.keys(devDependencies).forEach(function(key) {
        if (key.includes('karma')) {
          delete devDependencies[key];
        }
      });
      json.devDependencies = {
        ...devDependencies
      };
    });
  };
}

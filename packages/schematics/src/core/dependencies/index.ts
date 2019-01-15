import { JsonAstObject, JsonParseMode, parseJsonAst } from '@angular-devkit/core';
import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { NodeDependency, NodeDependencyType } from '@schematics/angular/utility/dependencies';
import {
  appendPropertyInAstObject,
  findPropertyInAstObject,
  insertPropertyInAstObjectInOrder
} from '@schematics/angular/utility/json-utils';

export { NodeDependency, NodeDependencyType };

export function addProjectDependencies(tree: Tree, projectPath: string, dependencies: NodeDependency[]): void {
  addPackageJsonDependencies(tree, projectPath, dependencies);
}

export function addWorkspaceDependencies(tree: Tree, dependencies: NodeDependency[]): void {
  return addPackageJsonDependencies(tree, '', dependencies);
}

function addPackageJsonDependencies(tree: Tree, packageJsonPath: string, dependencies: NodeDependency[]): void {
  const packageJsonAst = _readPackageJson(tree, `${packageJsonPath}/package.json`);
  const recorder = tree.beginUpdate(`${packageJsonPath}/package.json`);

  dependencies.forEach((dependency: NodeDependency) => {
    const depsNode = findPropertyInAstObject(packageJsonAst, dependency.type);

    if (!depsNode) {
      // Haven't found the dependencies key, add it to the root of the package.json.
      appendPropertyInAstObject(
        recorder,
        packageJsonAst,
        dependency.type,
        {
          [dependency.name]: dependency.version
        },
        2
      );
    } else if (depsNode.kind === 'object') {
      // check if package already added
      const depNode = findPropertyInAstObject(depsNode, dependency.name);

      if (!depNode) {
        // Package not found, add it.
        insertPropertyInAstObjectInOrder(recorder, depsNode, dependency.name, dependency.version, 4);
      } else if (dependency.overwrite) {
        // Package found, update version if overwrite.
        const { end, start } = depNode;
        recorder.remove(start.offset, end.offset - start.offset);
        recorder.insertRight(start.offset, JSON.stringify(dependency.version));
      }
    }
  });

  tree.commitUpdate(recorder);
}

function _readPackageJson(tree: Tree, pkgJsonPath: string): JsonAstObject {
  const buffer = tree.read(pkgJsonPath);
  if (buffer === null) {
    throw new SchematicsException('Could not read package.json.');
  }
  const content = buffer.toString();

  const packageJson = parseJsonAst(content, JsonParseMode.Strict);
  if (packageJson.kind != 'object') {
    throw new SchematicsException('Invalid package.json. Was expecting an object');
  }

  return packageJson;
}

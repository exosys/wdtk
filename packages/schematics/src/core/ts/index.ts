import * as ts from '@schematics/angular/node_modules/typescript';
import { SourceFile } from '@schematics/angular/node_modules/typescript';
import { Tree, SchematicsException } from '@angular-devkit/schematics';

export function getSourceFile(tree: Tree, path: string): SourceFile {
  const buffer = tree.read(path);
  if (!buffer) {
    throw new SchematicsException(`Failed to read file '${path}'`);
  }
  const content = buffer.toString();
  const source = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true);
  return source;
}

import * as ts from 'typescript';
import { SourceFile } from 'typescript';
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

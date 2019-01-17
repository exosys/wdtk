import * as ts from 'typescript';
import { SourceFile } from 'typescript';
import { Tree, SchematicsException } from '@angular-devkit/schematics';
import { Change, InsertChange, RemoveChange, ReplaceChange, NoopChange } from '@schematics/angular/utility/change';

export function getSourceFile(tree: Tree, path: string): SourceFile {
  const buffer = tree.read(path);
  if (!buffer) {
    throw new SchematicsException(`Failed to read file '${path}'`);
  }
  const content = buffer.toString();
  const source = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true);
  return source;
}

export function updateSourceFile(tree: Tree, sourceFile: SourceFile, changes: Change[]): void {
  if (changes.length === 0) {
    return;
  }
  const recorder = tree.beginUpdate(sourceFile.fileName);
  changes.forEach((change: Change) => {
    if (change instanceof InsertChange) {
      recorder.insertLeft(change.pos, change.toAdd);
    } else if (change instanceof RemoveChange) {
      recorder.remove((<any>change).pos - 1, (<any>change).toRemove.length + 1);
    } else if (change instanceof ReplaceChange) {
      recorder.remove((<any>change).pos + 1, (<any>change).oldText.length);
      recorder.insertLeft((<any>change).pos + 1, (<any>change).newText);
    } else if (change instanceof NoopChange) {
      //do nothing
    } else {
      throw new Error(`Unexpected Change '${change}'`);
    }
  });
  tree.commitUpdate(recorder);
}

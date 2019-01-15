import { Tree, SchematicsException } from '@angular-devkit/schematics';
import * as ts from 'typescript';
import { addDeclarationToModule as ngAddDeclarationToModule } from '@schematics/angular/utility/ast-utils';
import { InsertChange } from '@schematics/angular/utility/change';

export function addDeclarationToModule(tree: Tree, modulePath: string, classifiedName: string, importPath: string): void {
  const source = readIntoSourceFile(tree, modulePath);
  const changes = ngAddDeclarationToModule(<any>source, modulePath, classifiedName, importPath);
  const recorder = tree.beginUpdate(`${modulePath}`);
  for (const change of changes) {
    if (change instanceof InsertChange) {
      recorder.insertLeft(change.pos, change.toAdd);
    }
  }
  tree.commitUpdate(recorder);
}

function readIntoSourceFile(host: Tree, modulePath: string): ts.SourceFile {
  const text = host.read(modulePath);
  if (text === null) {
    throw new SchematicsException(`File ${modulePath} does not exist.`);
  }
  const sourceText = text.toString('utf-8');

  return ts.createSourceFile(modulePath, sourceText, ts.ScriptTarget.Latest, true);
}

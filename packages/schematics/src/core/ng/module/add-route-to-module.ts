import { Change, InsertChange } from '@schematics/angular/utility/change';
import { findNodes } from '@schematics/angular/utility/ast-utils';
import * as ts from 'typescript';

export function addRouteToModule(moduleSource: ts.SourceFile, routePath: string, routeLoadChildren: string): Change[] {
  const result: Change[] = [];

  const statements = findNodes(moduleSource, ts.SyntaxKind.VariableStatement);
  for (const statement of statements) {
    if (ts.isVariableStatement(statement)) {
      const [declaration] = statement.declarationList.declarations;
      if (ts.isVariableDeclaration(declaration) && declaration.initializer && declaration.name.getText() === 'routes') {
        const node = declaration.initializer.getChildAt(1);
        const t = node.getText();
        let lastRouteNode = node.getLastToken();

        if (!lastRouteNode) {
          lastRouteNode = node;
          result.push(
            new InsertChange(moduleSource.fileName, lastRouteNode.getEnd(), `\n{ path:'', redirectTo:'${routePath}', pathMatch:'full' },\n`)
          );
        } else {
          if (lastRouteNode.kind !== ts.SyntaxKind.CommaToken) {
            result.push(new InsertChange(moduleSource.fileName, lastRouteNode.getEnd(), ','));
          }
        }
        result.push(
          new InsertChange(moduleSource.fileName, lastRouteNode.getEnd(), `{ path:'${routePath}', loadChildren:'${routeLoadChildren}' }\n`)
        );
      }
    }
  }
  return result;
}

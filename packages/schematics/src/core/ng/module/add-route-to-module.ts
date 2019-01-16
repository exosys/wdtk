import { Change } from '@schematics/angular/utility/change';
import * as ts from '../../ts';
import { findNodes } from '@schematics/angular/utility/ast-utils';
export function addRouteToModule(
  source: ts.SourceFile,
  ngRoutingModulePath: string,
  routePath: string,
  routeLoadChildren: string
): Change[] {
    const statements = findNodes(source, ts.SyntaxKind.VariableStatement);
    for(const statement of statements) {
        if(ts.)
    }
    return [];
}

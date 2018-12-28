import { Workspace } from './workspace';
import { Tree } from '@angular-devkit/schematics';

export class CompositeWorkspace implements Workspace {
  private _host: Tree;
  constructor(tree: Tree) {
    this._host = tree;
  }
}

import { Tree } from '@angular-devkit/schematics';
import { Workspace } from './workspace';
import { CompositeWorkspace } from './workspace-impl';

export default function(tree: Tree): Workspace {
  return new CompositeWorkspace(tree);
}

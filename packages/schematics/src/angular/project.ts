import { Tree, Rule, SchematicContext } from '@angular-devkit/schematics';
import { getWorkspace as getNgWorkspace, updateWorkspace as updateNgWorkspace } from '@schematics/angular/utility/config';
import { getProject as getNgProject } from '@schematics/angular/utility/project';
import { WorkspaceProject as NgProject } from '@schematics/angular/utility/workspace-models';

export function getProject(name: string, tree: Tree) {
  const workspace = getNgWorkspace(tree);
  const project = getNgProject(workspace, name);
  return project;
}

export function updateProject(name: string, project: NgProject): Rule {
  return (tree: Tree, schematicContext: SchematicContext) => {
    const workspace = getNgWorkspace(tree);
    workspace.projects[name] = project;
    return updateNgWorkspace(workspace);
  };
}

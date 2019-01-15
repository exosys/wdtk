import { Tree, Rule, SchematicContext } from '@angular-devkit/schematics';
import { getWorkspace as getNgWorkspace, updateWorkspace as updateNgWorkspace } from '@schematics/angular/utility/config';
import { getProject as getNgProject } from '@schematics/angular/utility/project';
import { WorkspaceProject as NgProject, ProjectType } from '@schematics/angular/utility/workspace-models';
export { NgProject as Project, ProjectType };
// export { ProjectType };

export function getProject<TProjectType extends ProjectType = ProjectType.Application>(name: string, tree: Tree): NgProject<TProjectType> {
  const workspace = getNgWorkspace(tree);
  const project: NgProject<TProjectType> = getNgProject(workspace, name);
  return project;
}

export function updateProject(name: string, project: NgProject<ProjectType>): Rule {
  return (tree: Tree, schematicContext: SchematicContext) => {
    const workspace = getNgWorkspace(tree);
    workspace.projects[name] = project;
    return updateNgWorkspace(workspace);
  };
}

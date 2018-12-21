import { Rule, mergeWith, apply, url, noop, template } from '@angular-devkit/schematics';
import { strings, join } from '@angular-devkit/core';
import { Schema } from './schema';
import { toFileName } from '../../util/string';
import { versions } from './../../versions';
import { workspace } from '@angular-devkit/core/src/experimental';
export default function(schema: Schema): Rule {
  const opts = normalizeSchema(schema);
  let workspaces: any = [];
  workspaces.push(`"${opts.newPackageRoot}/${opts.appPackageRoot}/**"`);
  workspaces.push(`"${opts.newPackageRoot}/${opts.libPackageRoot}/**"`);
  workspaces = workspaces.join(',\n');
  return mergeWith(
    apply(url('./files'), [
      template({
        utils: strings,
        ...(opts as any),
        dot: '.',
        versions,
        workspaces
      })
    ])
  );
}

function normalizeSchema(schema: Schema): Schema {
  const name = toFileName(schema.name);
  return { ...schema, name };
}

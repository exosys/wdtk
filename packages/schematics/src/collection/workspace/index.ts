import { Rule, mergeWith, apply, url, noop, template } from '@angular-devkit/schematics';
import { strings, join } from '@angular-devkit/core';
import { Schema } from './schema';
import { dasherize } from '@angular-devkit/core/src/utils/strings';
import { versions } from './../../versions';

export default function(schema: Schema): Rule {
  const opts = normalizeSchema(schema);
  let workspaces: any = [];
  workspaces.push(`"${opts.newPackageRoot}/${opts.appPackageRoot}/**"`);
  workspaces.push(`"${opts.newPackageRoot}/${opts.libPackageRoot}/**"`);
  workspaces = workspaces.join(',\n');
  //FIXME add dependency on angular compiler
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
  const name = dasherize(schema.name);
  return { ...schema, name };
}

import { Rule, mergeWith, apply, url, noop, template } from '@angular-devkit/schematics';
import { strings } from '@angular-devkit/core';
import { Schema } from './schema';
import { toFileName } from '../../util/string';
import { versions } from './../../versions';
export default function(schema: Schema): Rule {
  const opts = normalizeSchema(schema);
  return mergeWith(
    apply(url('./files'), [
      template({
        utils: strings,
        ...(opts as any),
        dot: '.',
        versions
      })
    ])
  );
}

function normalizeSchema(schema: Schema): Schema {
  const name = toFileName(schema.name);
  return { ...schema, name };
}

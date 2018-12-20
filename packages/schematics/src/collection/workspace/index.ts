import { Rule, mergeWith, apply, url, noop } from '@angular-devkit/schematics';

export default function(): Rule {
  return mergeWith(apply(url('./files'), [noop()]));
}

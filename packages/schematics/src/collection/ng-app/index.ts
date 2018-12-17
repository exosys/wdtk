import { Rule, Tree } from '@angular-devkit/schematics';
import { Schema } from './schema';

interface NormalizedSchema extends Schema {}

export default function(schema: Schema): Rule {
  return (tree: Tree) => {
    console.error('here');
  };
}

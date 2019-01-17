import { ModuleOptions } from '@schematics/angular/utility/find-module';

export interface Schema extends ModuleOptions {
  project: string;
  prefix?: string;
  selector?: string;
  routePath?: string;
  style?: string;

  /**
   * When true, does not create "spec.ts" test files for the app.
   */
  skipTests?: boolean;
}

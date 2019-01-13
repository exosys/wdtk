import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';
export interface Schema extends ApplicationOptions {
  directory?: string;
  skipFormat: boolean;
  unitTestRunner: UnitTestRunner;
  e2eTestRunner: E2eTestRunner;
}

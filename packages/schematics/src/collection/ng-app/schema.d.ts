import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';
export interface Schema extends ApplicationOptions {
  skipFormat: boolean;
  skipInstall?: boolean;
  directory?: string;
  tags?: string;
  unitTestRunner: UnitTestRunner;
  e2eTestRunner: E2eTestRunner;
}

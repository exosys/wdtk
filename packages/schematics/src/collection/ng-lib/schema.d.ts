import { Schema as LibraryOptions } from '@schematics/angular/library/schema';
import { UnitTestRunner } from '../../core/unit-test';

export interface Schema extends LibraryOptions {
  /**
   * The name of the library.
   */
  name: string;
  directory?: string;
  parentModule?: string;
  project?: string;
  routing?: boolean;
  lazy?: boolean;
  skipFormat?: boolean;
  style?: string;
  unitTestRunner?: UnitTestRunner;
}

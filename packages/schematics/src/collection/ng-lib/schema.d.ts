import { UnitTestRunner } from '../../core/unit-test';

export interface Schema {
  name: string;
  skipFormat?: boolean;
  skipInstall?: boolean;
  directory?: string;
  unitTestRunner?: UnitTestRunner;
  style?: string;
  prefix?: string;
  routing?: boolean;
  lazy?: boolean;
  parentModule?: string;
}

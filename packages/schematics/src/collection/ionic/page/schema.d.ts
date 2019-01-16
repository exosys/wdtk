export interface Schema {
  project: string;
  name: string;
  flat?: boolean;
  path?: string;
  prefix?: string;
  selector?: string;
  routePath?: string;
  styleext?: string;

  /**
   * When true, does not create "spec.ts" test files for the app.
   */
  skipTests?: boolean;
}

import { GenericSchematicSchema } from '../generic-schematic-schema';

export interface Schema extends GenericSchematicSchema {
  /**
   * When specified the workspace will be created in a new directory with the given name.
   */
  name?: string;
}

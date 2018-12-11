export interface BaseCommandOptions {
  help?: boolean | string;
}
export abstract class Command<T extends BaseCommandOptions = BaseCommandOptions> {}

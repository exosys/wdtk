export interface Schema {
  help?: HelpUnion;
}

export declare type HelpUnion = boolean | HelpEnum;

export declare enum HelpEnum {
  HelpJSON = 'JSON',
  JSON = 'json'
}

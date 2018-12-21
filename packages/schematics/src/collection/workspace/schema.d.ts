export interface Schema {
  name: string;
  newPackageRoot?: string;
  appPackageRoot?: string;
  libPackageRoot?: string;

  skipFormat?: boolean;
}

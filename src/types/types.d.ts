export type Environment = {
  /** The name of your environment */
  name: string;
  /** The endpoint of your environment (eg. https://api.example.com) */
  endpoint: string;
  /** The admin access token of your environment https://scribehow.com/shared/Workflow__G2UI2t1iRYOEFTknErl1vA */
  accessToken: string;
};

export type MergedRole = {
  name: string;
  sourceId: number;
  targetId: number;
};

export type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  location: string;
  title: string;
  tags: string[];
  avatar: string;
};

export type Role = {
  id: string;
  name: string;
  icon: string;
  description: string;
  ip_access: string;
  enforce_tfa: boolean;
  admin_access: boolean;
  app_access: boolean;
  users: User[];
};

export type Permission = {
  uid?: string;
  id?: number;
  role: string;
  collection: string;
  action: string;
  permissions: any;
  validation: any;
  preset: any;
  fields: string[];
};

export interface Preset {
  uid?: string;
  id?: number;
  bookmark: null;
  user: string;
  role: null;
  collection: string;
  search: null;
  filters: any[];
  layout: string;
  layout_query: {
    tabular: { sort: string; fields: string[]; page: number };
  };
  layout_options: {
    tabular: {
      widths: {
        action: number;
        collection: number;
        timestamp: number;
        user: number;
      };
    };
  };
}

export type AdminIds = {
  sourceAdminId: string;
  targetAdminId: string;
};

export type DirectusMigratorCommand = {
  init?: boolean;
  add?: boolean;
  force?: boolean;
  source?: string | Environment;
  target?: string | Environment;
  debug?: boolean;
  verbose?: boolean;
  roles?: boolean;
  permissions?: boolean;
  schema?: boolean;
  help?: boolean;
  flows?: boolean;
  presets?: boolean;
};

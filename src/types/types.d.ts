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

export interface Dashboard {
  uid?: string;
  id?: string;
  name: string;
  icon: string;
  note: string;
  date_created: string;
  user_created: string;
  color: string;
  panels: string[];
}

export interface Panel {
  uid?: string;
  id?: string;
  dashboard: string;
  name: string;
  icon: string;
  color: string;
  show_header: boolean;
  note: string;
  type: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  options: Options;
  date_created: string;
  user_created: string;
}
export interface Translation {
  uid?: string;
  id?: string;
  key: string;
  language: string;
  value: string;
}

export interface Translation {
  uid?: string;
  id?: string;
  key: string;
  language: string;
  value: string;
}
export interface Webhook {
  uid?: string;
  id?: number;
  name: string;
  method: string;
  url: string;
  status: string;
  data: boolean;
  actions: string[];
  collections: string[];
}
export interface Setting {
  uid?: string;
  id?: number;
  project_name: string;
  project_descriptor: string;
  project_url: string | null;
  project_color: string | null;
  project_logo: string | null;
  public_foreground: string | null;
  public_background: string | null;
  public_note: string | null;
  auth_login_attempts: number;
  auth_password_policy: string | null;
  storage_asset_transform: string;
  storage_asset_presets: [
    {
      key: string;
      fit: string;
      width: number;
      height: number;
      quality: number;
      withoutEnlargement: boolean;
    }
  ];
  custom_css: string | null;
  storage_default_folder: string | null;
  basemaps: string | null;
  mapbox_key: string | null;
  module_bar: string | null;
  custom_aspect_ratios: [
    {
      text: string;
      value: number;
    }
  ];
}

export interface Options {}

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
  dashboards?: boolean;
  translations?: boolean;
  webhooks?: boolean;
  settings?: boolean;
};

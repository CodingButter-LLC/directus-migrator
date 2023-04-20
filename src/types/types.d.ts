
export type Environment = {
  /** The name of your environment */
  name: string
  /** The endpoint of your environment (eg. https://api.example.com) */
  endpoint: string
  /** The admin access token of your environment https://scribehow.com/shared/Workflow__G2UI2t1iRYOEFTknErl1vA */
  accessToken: string
}


export type MergedRole = {
  name: string
  sourceId: number
  targetId: number
}



export type Files = {
  id: number
  storage: string
  filename_disk: string
  filename_download: string
  title: string
  type: string
  folder: string
  uploaded_by: string[]
  uploaded_on: string
  modified_by: string[]
  filesize: number
  width: number
  height: number
  duration: number
  description: string
  location: string
  tags: string[]
  metadata: any
}

export type User = {
  id: number
  first_name: string
  last_name: string
  email: string
  password: string
  location: string
  title: string
  tags: string[]
  avatar: string
}

export type Role = {
  id: number
  name: string
  icon: string
  description: string
  ip_access: string
  enforce_tfa: boolean
  admin_access: boolean
  app_access: boolean
  users?: User[]
}

export type Permission {
  id?: number
  role: string[]
  collection: string
  action: string
  permissions: any
  validation: any
  preset: any
  fields: string[]
}
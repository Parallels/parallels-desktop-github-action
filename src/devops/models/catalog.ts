export interface PullCatalogRequest {
  catalog_id: string
  version: string
  machine_name: string
  owner?: string
  connection: string
  path?: string
  start_after_pull: boolean
}

export interface PullCatalogResponse {
  id: string
  machine_id: string
  machine_name: string
  manifest: PullCatalogResponseManifest
}

export interface PullCatalogResponseManifest {
  name: string
  id: string
  catalog_id: string
  description: string
  architecture: string
  version: string
  type: string
  tags: string[]
  path: string
  pack_filename: string
  metadata_filename: string
  provider: PullCatalogResponseProvider
  created_at: string
  updated_at: string
  required_roles: string[]
  last_downloaded_at: string
  last_downloaded_user: string
  download_count: number
  pack_contents: PullCatalogResponsePackContent[]
}

export interface PullCatalogResponsePackContent {
  name: string
  path: string
}

export interface PullCatalogResponseProvider {
  type: string
  host: string
  user: string
  password: string
  meta: PullCatalogResponseMeta
}

export interface PullCatalogResponseMeta {
  access_key: string
  bucket: string
  region: string
  secret_key: string
}

export interface CreateVmRequest {
  name: string;
  owner?: string;
  architecture: string;
  start_on_create: boolean;
  catalog_manifest: CreateVmRequestCatalogManifest;
}

export interface CreateVmRequestCatalogManifest {
  catalog_id: string;
  version: string;
  connection: string;
  path?: string;
  specs?: CreateVmRequestSpecs;
}

export interface CreateVmRequestSpecs {
  cpu?: string;
  memory?: string;
}

export interface CreateVMResponse {
  id: string;
  host?: string;
  name: string;
  owner: string;
  current_state: string;
}

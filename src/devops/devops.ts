import HttpClient, { HttpHeader, HttpResponse } from '../api_client/api_client'
import * as core from '@actions/core'
import { HealthProbeResponse } from './models/health_probe'
import { LoginRequest, LoginResponse } from './models/login'
import { VirtualMachine } from './models/virtual_machine'
import { HealthCheck as HealthCheckResponse } from './models/health_check'
import { ParallelsDesktopLicense } from './models/parallels-license'
import { PullCatalogRequest, PullCatalogResponse } from './models/catalog'
import { CloneRequest, CloneResponse } from './models/clone'
import { VirtualMachineStatus } from './models/status'
import { ExecuteRequest, ExecuteResponse } from './models/execute'
import { CreateVmRequest as CreateVmRequest, CreateVMResponse } from './models/create'

export class DevOps {
  baseUrl: string
  private client: HttpClient
  private token: string | undefined = undefined
  private tokenExpiry: number = 0
  private apiKey: string | undefined = undefined
  private target: 'host' | 'orchestrator' | 'none' = 'host'

  constructor(baseUrl: string, target: 'host' | 'orchestrator' | 'none') {
    this.baseUrl = baseUrl
    this.target = target
    this.client = new HttpClient()
  }

  getUrl(path: string, target: 'host' | 'orchestrator' | 'none'): string {
    let url = ''
    if (target === 'host') {
      url = `${this.baseUrl}/v1/`
    } else if (target === 'orchestrator') {
      url = `${this.baseUrl}/v1/orchestrator`
    } else if (target === 'none') {
      url = this.baseUrl
    }

    if (path) {
      if (path.startsWith('/')) {
        url = `${url}${path}`
      } else {
        url = `${url}/${path}`
      }
    }
    return url
  }

  async getHealthStatus(): Promise<'up' | 'down'> {
    try {
      const url = this.getUrl('/health/probe', 'none')
      const response = await this.client.get<HealthProbeResponse>(url)
      if (response.StatusCode !== 200) {
        return 'down'
      }
      return response.Data.status === 'OK' ? 'up' : 'down'
    } catch (error) {
      return 'down'
    }
  }

  async getHealthCheck(): Promise<HealthCheckResponse> {
    try {
      const url = this.getUrl('/health/system?full=true', 'host')
      const response = await this.client.get<HealthCheckResponse>(url)
      if (response.StatusCode !== 200) {
        return response.Data as HealthCheckResponse
      }
      return response.Data
    } catch (error) {
      return Promise.reject(error)
    }
  }

  async getPDLicense(): Promise<ParallelsDesktopLicense> {
    try {
      const url = this.getUrl('/config/parallels-desktop/license', 'host')
      const headers: HttpHeader[] = []
      const authHeader = await this.getAuthenticationHeader()
      headers.push(authHeader)
      const response = await this.client.get<ParallelsDesktopLicense>(url, headers)
      return response.Data
    } catch (error) {
      return Promise.reject(error)
    }
  }

  async CloneVM(idOrName: string, request: CloneRequest): Promise<CloneResponse> {
    try {
      if (!idOrName) {
        throw new Error('Invalid id or name')
      }
      const encodedUrl = encodeURIComponent(idOrName)
      const url = this.getUrl(`/machines/${encodedUrl}/clone`, 'host')
      const headers: HttpHeader[] = []
      const authHeader = await this.getAuthenticationHeader()
      headers.push(authHeader)
      const response = await this.client.put<CloneResponse>(url, request, headers)
      return response.Data
    } catch (error) {
      return Promise.reject(error)
    }
  }

  async pullCatalogImage(request: PullCatalogRequest): Promise<PullCatalogResponse> {
    try {
      const url = this.getUrl('/catalog/pull', 'host')
      const headers: HttpHeader[] = []
      const authHeader = await this.getAuthenticationHeader()
      headers.push(authHeader)
      const response = await this.client.put<PullCatalogResponse>(url, request, headers)
      return response.Data
    } catch (error) {
      return Promise.reject(error)
    }
  }

  async createVm(request: CreateVmRequest): Promise<CreateVMResponse> {
    try {
      const url = this.getUrl('/machines', this.target)
      const headers: HttpHeader[] = []
      const authHeader = await this.getAuthenticationHeader()
      headers.push(authHeader)
      const response = await this.client.post<CreateVMResponse>(url, request, headers)
      return response.Data
    } catch (error) {
      return Promise.reject(error)
    }
  }

  async deleteVM(idOrName: string): Promise<boolean> {
    try {
      if (!idOrName) {
        throw new Error('Invalid id or name')
      }
      const encodedUrl = encodeURIComponent(idOrName)
      const url = this.getUrl(`/machines/${encodedUrl}`, this.target)
      const headers: HttpHeader[] = []
      const authHeader = await this.getAuthenticationHeader()
      headers.push(authHeader)
      await this.client.delete(url, headers)
      return true
    } catch (error) {
      return Promise.reject(error)
    }
  }

  async getAllMachines(): Promise<VirtualMachine[]> {
    try {
      const url = this.getUrl('/machines', this.target)
      const headers: HttpHeader[] = []
      const authHeader = await this.getAuthenticationHeader()
      headers.push(authHeader)
      const response = await this.client.get<VirtualMachine[]>(url, headers)
      return response.Data
    } catch (error) {
      return Promise.reject(error)
    }
  }

  async getMachine(idOrName: string): Promise<VirtualMachine> {
    try {
      const url = this.getUrl(`/machines/${idOrName}`, this.target)
      const headers: HttpHeader[] = []
      const authHeader = await this.getAuthenticationHeader()
      headers.push(authHeader)
      const response = await this.client.get<VirtualMachine>(url, headers)
      return response.Data
    } catch (error) {
      return Promise.reject(error)
    }
  }

  async getMachineStatus(idOrName: string): Promise<VirtualMachineStatus> {
    try {
      const url = this.getUrl(`/machines/${idOrName}/status`, this.target)
      const headers: HttpHeader[] = []
      const authHeader = await this.getAuthenticationHeader()
      headers.push(authHeader)
      const response = await this.client.get<VirtualMachineStatus>(url, headers)
      return response.Data
    } catch (error) {
      return Promise.reject(error)
    }
  }

  async setMachineAction(idOrName: string, action: 'start' | 'stop'): Promise<VirtualMachineStatus> {
    try {
      const url = this.getUrl(`/machines/${idOrName}`, this.target)
      const headers: HttpHeader[] = []
      const authHeader = await this.getAuthenticationHeader()
      headers.push(authHeader)
      let response: HttpResponse<VirtualMachineStatus>
      switch (action) {
        case 'start':
          response = await this.client.get<VirtualMachineStatus>(`${url}/start`, headers)
          break
        case 'stop':
          response = await this.client.get<VirtualMachineStatus>(`${url}/stop`, headers)
          break
        default:
          throw new Error('Invalid action')
      }

      return response.Data
    } catch (error) {
      return Promise.reject(error)
    }
  }

  async ExecuteOnVm(idOrName: string, request: ExecuteRequest): Promise<ExecuteResponse> {
    try {
      if (!idOrName) {
        throw new Error('Invalid id or name')
      }
      const encodedUrl = encodeURIComponent(idOrName)
      const url = this.getUrl(`/machines/${encodedUrl}/execute`, this.target)
      const headers: HttpHeader[] = []
      const authHeader = await this.getAuthenticationHeader()
      headers.push(authHeader)
      const response = await this.client.put<ExecuteResponse>(url, request, headers)
      return response.Data
    } catch (error) {
      return Promise.reject(error)
    }
  }

  private async getAuthenticationHeader(): Promise<HttpHeader> {
    if (!this.token && !this.apiKey) {
      await this.login()
    }
    if (this.token) {
      const currentDate = Math.floor(Date.now() / 1000)
      if (currentDate > this.tokenExpiry) {
        await this.login()
      }
      return {
        name: 'Authorization',
        value: `Bearer ${this.token}`
      }
    } else if (this.apiKey) {
      return {
        name: 'X-Api-Key',
        value: `${this.apiKey}`
      }
    }

    throw new Error('Not logged in')
  }

  async login(): Promise<LoginResponse> {
    const username = core.getInput('username')
    const password = core.getInput('password')
    const apiKey = core.getInput('api-key')
    const apiSecret = core.getInput('api-secret')
    const url = `${this.baseUrl}/v1/auth/token`
    if (apiKey && apiSecret) {
      const encodedKey = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
      this.apiKey = encodedKey
      const response: LoginResponse = { apiKey, expires_at: 0 }
      return response
    } else {
      const request: LoginRequest = {
        email: username,
        password
      }

      try {
        const response = await this.client.post<LoginResponse>(url, request)
        if (response.StatusCode !== 200) {
          throw new Error('Login failed')
        }
        this.token = response.Data.token
        this.tokenExpiry = response.Data.expires_at ?? 0
        return response.Data
      } catch (error) {
        return Promise.reject(error)
      }
    }
  }
}

export default DevOps

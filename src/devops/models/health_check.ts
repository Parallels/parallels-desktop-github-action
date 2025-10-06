export interface HealthCheck {
  healthy: boolean
  message: string
  services: Service[]
}

export interface Service {
  name: string
  healthy: boolean
  message?: string
}

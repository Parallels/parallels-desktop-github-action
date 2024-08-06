import { AmplitudeEvent, EVENT_HEALTH_USE_CASE, Telemetry } from '../telemetry/telemetry'
import DevOps from '../devops/devops'
import { HealthCheck } from '../devops/models/health_check'

export async function HealthUseCase(telemetry: Telemetry, client: DevOps): Promise<HealthCheck> {
  const response = client.getHealthCheck()
  const event: AmplitudeEvent = {
    event: EVENT_HEALTH_USE_CASE,
    properties: [
      {
        name: 'operation',
        value: 'system_health_check'
      },
      {
        name: 'host',
        value: client.baseUrl
      }
    ]
  }

  telemetry.track(event)
  return await response
}

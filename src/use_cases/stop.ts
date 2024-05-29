import { AmplitudeEvent, EVENT_STOP_USE_CASE, Telemetry } from '../telemetry/telemetry'
import DevOps from '../devops/devops'
import * as core from '@actions/core'

export async function StopUseCase(telemetry: Telemetry, client: DevOps): Promise<boolean> {
  const event: AmplitudeEvent = {
    event: EVENT_STOP_USE_CASE,
    properties: [
      {
        name: 'operation',
        value: 'stop_virtual_machine'
      },
      {
        name: 'host',
        value: client.baseUrl
      }
    ]
  }

  try {
    const machine_name = core.getInput('machine_name')
    core.info(`Stopping virtual machine ${machine_name}`)

    const machineStatus = await client.getMachineStatus(machine_name)
    if (machineStatus.status === 'stopped') {
      return true
    }

    if (machineStatus.status === 'running') {
      await client.setMachineAction(machine_name, 'stop')
    } else {
      core.setFailed(
        `Error stopping virtual machine ${machine_name}: the current status is not running but instead ${machineStatus.status}`
      )
      return false
    }

    telemetry.track(event)
    return true
  } catch (error) {
    core.setFailed(`Error stopping virtual machine: ${error}`)
    event.properties?.push({
      name: 'error',
      value: `${error}`
    })
    telemetry.track(event)
    return Promise.reject(error)
  }
}

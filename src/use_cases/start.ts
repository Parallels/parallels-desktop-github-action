import { AmplitudeEvent, EVENT_START_USE_CASE, Telemetry } from '../telemetry/telemetry'
import DevOps from '../devops/devops'
import * as core from '@actions/core'

export async function StartUseCase(telemetry: Telemetry, client: DevOps): Promise<boolean> {
  try {
    const event: AmplitudeEvent = {
      event: EVENT_START_USE_CASE,
      properties: [
        {
          name: 'operation',
          value: 'start_virtual_machine'
        },
        {
          name: 'host',
          value: client.baseUrl
        }
      ]
    }

    core.info(`Starting virtual machine`)
    const machine_name = core.getInput('machine_name')

    const machineStatus = await client.getMachineStatus(machine_name)
    if (machineStatus.status === 'running') {
      return true
    }

    if (machineStatus.status === 'stopped') {
      await client.setMachineAction(machine_name, 'start')
    } else {
      core.setFailed(
        `Error starting virtual machine ${machine_name}: the current status is not stopped but instead ${machineStatus.status}`
      )
      return false
    }

    telemetry.track(event)
    return true
  } catch (error) {
    core.setFailed(`Error starting virtual machine: ${error}`)
    return Promise.reject(error)
  }
}

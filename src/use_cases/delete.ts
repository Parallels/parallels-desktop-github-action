import { AmplitudeEvent, EVENT_DELETE_USE_CASE, Telemetry } from '../telemetry/telemetry'
import DevOps from '../devops/devops'
import * as core from '@actions/core'

export async function DeleteUseCase(telemetry: Telemetry, client: DevOps): Promise<boolean> {
  try {
    const event: AmplitudeEvent = {
      event: EVENT_DELETE_USE_CASE,
      properties: [
        {
          name: 'operation',
          value: 'delete_virtual_machine'
        },
        {
          name: 'host',
          value: client.baseUrl
        }
      ]
    }

    core.info(`Deleting virtual machine`)
    const machine_name = core.getInput('machine_name')

    const machineStatus = await client.getMachineStatus(machine_name)
    if (machineStatus.status !== 'stopped') {
      await client.setMachineAction(machine_name, 'stop')
    }

    await client.deleteVM(machine_name)
    core.info(`Deleted virtual machine: ${machine_name}`)

    telemetry.track(event)
    return true
  } catch (error) {
    core.setFailed(`Error deleting virtual machine: ${error}`)
    return Promise.reject(error)
  }
}

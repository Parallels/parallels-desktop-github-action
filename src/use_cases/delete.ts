import {
  AmplitudeEvent,
  EVENT_DELETE_USE_CASE,
  Telemetry
} from '../telemetry/telemetry'
import DevOps from '../devops/devops'
import { getInput, info, setFailed } from '@actions/core'

export async function DeleteUseCase(
  telemetry: Telemetry,
  client: DevOps
): Promise<boolean> {
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

  try {
    const machine_name = getInput('machine_name')
    info(`Deleting virtual machine ${machine_name}`)

    const machineStatus = await client.getMachineStatus(machine_name)
    if (machineStatus.status !== 'stopped') {
      info(`Stopping virtual machine ${machine_name}`)
      await client.setMachineAction(machine_name, 'stop')
    }

    await client.deleteVM(machine_name)
    info(`Deleted virtual machine: ${machine_name}`)

    telemetry.track(event)
    return true
  } catch (error) {
    setFailed(`Error deleting virtual machine: ${error}`)
    event.properties?.push({
      name: 'error',
      value: `${error}`
    })
    telemetry.track(event)
    return await Promise.reject(error)
  }
}

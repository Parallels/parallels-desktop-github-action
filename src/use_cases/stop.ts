import {
  AmplitudeEvent,
  EVENT_STOP_USE_CASE,
  Telemetry
} from '../telemetry/telemetry'
import DevOps from '../devops/devops'
import { getInput, info, setFailed } from '@actions/core'

export async function StopUseCase(
  telemetry: Telemetry,
  client: DevOps
): Promise<boolean> {
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
    const MACHINE_NAME = getInput('machine_name')
    info(`Stopping virtual machine ${MACHINE_NAME}`)

    const machineStatus = await client.getMachineStatus(MACHINE_NAME)
    if (machineStatus.status === 'stopped') {
      return true
    }

    if (machineStatus.status === 'running') {
      await client.setMachineAction(MACHINE_NAME, 'stop')
    } else {
      setFailed(
        `Error stopping virtual machine ${MACHINE_NAME}: the current status is not running but instead ${machineStatus.status}`
      )
      return false
    }

    await telemetry.track(event)
    return true
  } catch (error) {
    setFailed(`Error stopping virtual machine: ${error}`)
    event.properties?.push({
      name: 'error',
      value: `${error}`
    })
    await telemetry.track(event)
    return await Promise.reject(error)
  }
}

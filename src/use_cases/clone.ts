import { AmplitudeEvent, EVENT_CLONE_USE_CASE, Telemetry } from '../telemetry/telemetry'
import DevOps from '../devops/devops'
import * as core from '@actions/core'
import { v4 as uuidv4 } from 'uuid'
import { CloneRequest } from '../devops/models/clone'

export async function CloneUseCase(telemetry: Telemetry, client: DevOps): Promise<boolean> {
  const event: AmplitudeEvent = {
    event: EVENT_CLONE_USE_CASE,
    properties: [
      {
        name: 'operation',
        value: 'clone_virtual_machine'
      },
      {
        name: 'host',
        value: client.baseUrl
      }
    ]
  }
  try {
    let vmId = ''
    const base_vm = core.getInput('base_vm')
    core.info(`Cloning virtual machine ${base_vm}`)

    // Creating the clone request for the devops client
    const cloneRequest: CloneRequest = {
      clone_name: `${base_vm}_${uuidv4()}`
    }

    const response = await client.CloneVM(base_vm, cloneRequest)
    core.info(`Cloned virtual machine: ${response.id}`)
    vmId = response.id
    core.setOutput('vm_id', vmId)
    core.setOutput('vm_name', cloneRequest.clone_name)

    const startAfterCreate = core.getInput('start_after_op')
    if (startAfterCreate === 'true' && response.status !== 'running') {
      core.info(`Starting virtual machine ${vmId}`)
      await client.setMachineAction(vmId, 'start')
      await new Promise(resolve => setTimeout(resolve, 3000))
      core.info(`Started virtual machine: ${vmId}`)
    }

    telemetry.track(event)
    return true
  } catch (error) {
    core.setFailed(`Error cloning virtual machine: ${error}`)
    event.properties?.push({
      name: 'error',
      value: `${error}`
    })
    telemetry.track(event)
    return await Promise.reject(error)
  }
}

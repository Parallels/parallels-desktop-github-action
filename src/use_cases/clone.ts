import { AmplitudeEvent, EVENT_CLONE_USE_CASE, Telemetry } from "../telemetry/telemetry"
import DevOps from "../devops/devops"
import * as core from '@actions/core';
import { v4 as uuidv4 } from 'uuid';
import { CloneRequest } from '../devops/models/clone';

export async function CloneUseCase(telemetry: Telemetry, client: DevOps): Promise<boolean> {
  try {
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
        },
      ]
    }

    core.info(`Cloning virtual machine`)
    let vmId = ''
    const base_vm = core.getInput('base_vm')

    // Creating the clone request for the devops client
    const cloneRequest: CloneRequest = {
      clone_name: `${base_vm}_${uuidv4()}`,
    }

    const response = await client.CloneVM(base_vm, cloneRequest)
    core.info(`Cloned virtual machine: ${response.id}`)
    vmId = response.id
    core.setOutput('vm_id', vmId)
    core.setOutput('vm_name', cloneRequest.clone_name)

    telemetry.track(event)
    return true
  } catch (error) {
    core.setFailed(`Error cloning virtual machine: ${error}`)
    return Promise.reject(error)
  }
}
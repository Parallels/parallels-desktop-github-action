import { AmplitudeEvent, EVENT_RUN_USE_CASE, Telemetry } from '../telemetry/telemetry'
import DevOps from '../devops/devops'
import * as core from '@actions/core'
import { ExecuteRequest } from '../devops/models/execute'

export async function RunUseCase(telemetry: Telemetry, client: DevOps): Promise<boolean> {
  try {
    const event: AmplitudeEvent = {
      event: EVENT_RUN_USE_CASE,
      properties: [
        {
          name: 'operation',
          value: 'execute_virtual_machine'
        },
        {
          name: 'host',
          value: client.baseUrl
        }
      ]
    }

    core.info(`Execution command on virtual machine`)
    const machine_name = core.getInput('machine_name')
    const command = core.getInput('run')
    if (!command) {
      core.setFailed(`Invalid command ${command}`)
      return false
    }
    const machineStatus = await client.getMachineStatus(machine_name)
    if (machineStatus.status !== 'running') {
      core.setFailed(
        `Error executing command on virtual machine ${machine_name}: the current status is not running but instead ${machineStatus.status}`
      )
      return false
    }

    // Creating the clone request for the devops client
    const cloneRequest: ExecuteRequest = {
      command
    }

    const response = await client.ExecuteOnVm(machine_name, cloneRequest)
    core.info(`Executed command virtual machine: ${response.stdout}`)
    if (response.stderr || response.exit_code !== 0) {
      core.setFailed(`Error executing command on virtual machine: ${response.stderr}, exit code: ${response.exit_code}`)
      return false
    }
    core.setOutput('stdout', response.stdout)

    telemetry.track(event)
    return true
  } catch (error) {
    core.setFailed(`Error executing command virtual machine: ${error}`)
    return Promise.reject(error)
  }
}

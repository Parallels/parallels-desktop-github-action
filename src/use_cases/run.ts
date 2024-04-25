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
    const lines = command.split('\n')
    const machineStatus = await client.getMachineStatus(machine_name)
    if (machineStatus.status !== 'running') {
      core.setFailed(
        `Error executing command on virtual machine ${machine_name}: the current status is not running but instead ${machineStatus.status}`
      )
      return false
    }

    // waiting for machine to be ready
    const checkCommand = 'echo "ready"'
    const checkCommandRequest: ExecuteRequest = {
      command: checkCommand
    }
    for (let i = 0; i < 100; i++) {
      const response = await client.ExecuteOnVm(machine_name, checkCommandRequest)
      if (response.exit_code === 0) {
        break
      }

      core.info(`Waiting for virtual machine to be ready`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    let output = ''
    for (const line of lines) {
      // Skip empty lines or commented lines
      if (!line || line === '' || line === '\n') {
        continue
      }

      const cloneRequest: ExecuteRequest = {
        command: line
      }

      const response = await client.ExecuteOnVm(machine_name, cloneRequest)
      core.info(`Executed command virtual machine: ${line}`)
      if (response.stdout) {
        core.info(`Output: ${response.stdout}`)
      }
      if (response.stderr || response.exit_code !== 0) {
        core.setOutput('stdout', response.stdout)
        core.setOutput('stderr', response.stderr)
        core.setFailed(
          `Error executing command on virtual machine: ${response.stderr}, exit code: ${response.exit_code}`
        )
        return false
      }
      output += response.stdout
    }

    core.setOutput('stdout', output)

    telemetry.track(event)
    return true
  } catch (error) {
    core.setFailed(`Error executing command virtual machine: ${error}`)
    return Promise.reject(error)
  }
}

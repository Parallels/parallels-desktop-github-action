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

    const machine_name = core.getInput('machine_name')
    core.info(`Execution command on virtual machine ${machine_name}`)
    const command = core.getInput('run')
    if (!command) {
      core.setFailed(`Invalid command ${command}`)
      return false
    }
    const lines = command.split('\n')

    core.info(`Checking the machine ${machine_name} status`)
    const machine = await client.getMachine(machine_name)
    if (machine.State !== 'running') {
      core.setFailed(
        `Error executing command on virtual machine ${machine_name}: the current status is not running but instead ${machine.State}`
      )
      return false
    }


    // waiting for machine to be ready
    let checkCommand = 'echo "ready"'
    if (machine.OS.startsWith('win')) {
      core.info(`Machine ${machine_name} is a Windows machine`)
      checkCommand = 'cmd.exe /C echo "ready"'
    }

    const checkCommandRequest: ExecuteRequest = {
      command: checkCommand
    }

    for (let i = 0; i < 100; i++) {
      core.info(`Checking if virtual machine ${machine_name} is ready [${i}/100]`)
      const response = await client.ExecuteOnVm(machine_name, checkCommandRequest)
      if (response.exit_code === 0) {
        break
      }
      core.info(`Machine ${machine_name} is not ready yet, waiting 1s, exit code: ${response.exit_code}`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    for (let i = 0; i < 100; i++) {
      core.info(`Checking if virtual machine ${machine_name} has network [${i}/100]`)
      const response = await client.getMachineStatus(machine_name)

      if (response.ip_configured && response.ip_configured !== '-') {
        core.info(`Machine ${machine_name} has ip assigned ${response.ip_configured}`)
        break
      }


      core.info(`Machine ${machine_name} does not have ip assigned, waiting 1s`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    let output = ''
    for (const line of lines) {
      let max_attempts = Number(core.getInput('max_attempts')) || 1
      if (max_attempts > 1) {
        core.info(`Setting max attempts to ${max_attempts}`)
      }
      while (max_attempts > 0) {
        max_attempts--
        core.info(`Executing command on virtual machine: ${line}`)
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
          core.info(`Output:\n${response.stdout}`)
        }

        if (response.stderr || response.exit_code !== 0) {
          if (max_attempts == 0) {
            core.setOutput('stdout', response.stdout)
            core.setOutput('stderr', response.stderr)
            core.setFailed(
              `Error executing command on virtual machine: ${response.stderr}, exit code: ${response.exit_code}`
            )
            return false
          } else {
            core.info(`Retrying command execution on virtual machine: ${line} [${max_attempts} attempts left]`)
          }
        } else {
          max_attempts = 0
          output += response.stdout
        }

        const timeoutSeconds = Number(core.getInput('timeout_seconds')) || 0
        if (timeoutSeconds > 0 && max_attempts > 0) {
          core.info(`Waiting ${timeoutSeconds} seconds before executing the next command`)
          await new Promise(resolve => setTimeout(resolve, timeoutSeconds * 1000))
        }
      }
    }

    core.setOutput('stdout', output)

    telemetry.track(event)
    return true
  } catch (error) {
    core.setFailed(`Error executing command virtual machine: ${error}`)
    return Promise.reject(error)
  }
}

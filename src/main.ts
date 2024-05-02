import * as core from '@actions/core'
import { START_EVENT, Telemetry } from './telemetry/telemetry'
import DevOps from './devops/devops'
import { HealthUseCase } from './use_cases/health'
import { PullUseCase } from './use_cases/pull'
import { CloneUseCase } from './use_cases/clone'
import { DeleteUseCase } from './use_cases/delete'
import { StartUseCase } from './use_cases/start'
import { RunUseCase } from './use_cases/run'
import { StopUseCase } from './use_cases/stop'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(telemetry: Telemetry): Promise<void> {
  // Send the start event
  try {
    await telemetry.track(START_EVENT)
    const operation = core.getInput('operation')
    const orchestrator_url = core.getInput('orchestrator_url')
    const host_url = core.getInput('host_url')
    const is_insecure = core.getInput('insecure') === 'true'

    let schema = 'https'
    let url = orchestrator_url
    let is_orchestrator = true

    if (is_insecure) {
      schema = 'http'
    }
    if (orchestrator_url && host_url) {
      core.warning('Both orchestrator_url and host_url are set. Using orchestrator_url')
    }
    if (host_url) {
      is_orchestrator = false
      url = host_url
    }

    if (!url) {
      core.setFailed('Either orchestrator_url or host_url must be set')
      return
    }

    // creating the devops client
    const baseUrl = `${schema}://${url}/api`
    const devops = new DevOps(baseUrl, is_orchestrator ? 'orchestrator' : 'host')

    if (operation !== 'test') {
      // checking if the host is alive and running
      const health = await devops.getHealthStatus()
      if (health !== 'up') {
        core.setFailed(`Host is down: ${baseUrl}`)
        return
      }
      if (is_orchestrator) {
        telemetry.setUserId('orchestrator')
        telemetry.setLicense('orchestrator')
      } else {
        const license = await devops.getPDLicense()
        if (license.uuid !== '') {
          telemetry.setUserId(license.uuid)
        }
        if (license.serial) {
          telemetry.setLicense(license.serial)
        }
      }
    }

    core.info(`Starting operation: ${operation}`)
    switch (operation) {
      case 'test':
        core.setOutput('vm_id', 'test_vm_id')
        core.setOutput('vm_name', 'test_vm_name')
        core.setOutput('host', 'test_host')
        core.info('Test operation')
        break
      case 'health-check':
        await HealthUseCase(telemetry, devops)
        break
      case 'pull':
        await PullUseCase(telemetry, devops)
        break
      case 'clone':
        await CloneUseCase(telemetry, devops)
        break
      case 'delete':
        await DeleteUseCase(telemetry, devops)
        break
      case 'start':
        await StartUseCase(telemetry, devops)
        break
      case 'stop':
        await StopUseCase(telemetry, devops)
        break
      case 'run':
        await RunUseCase(telemetry, devops)
        break
      default:
        core.setFailed(`Invalid operation: ${operation}`)
    }
  } catch (error) {
    console.log(error)
    core.setFailed('error')
  }
}

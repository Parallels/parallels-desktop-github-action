import { AmplitudeEvent, EVENT_CREATE_USE_CASE as EVENT_PULL_USE_CASE, Telemetry } from "../telemetry/telemetry"
import DevOps from "../devops/devops"
import * as core from '@actions/core';
import ImageHost from "../imageHost";
import { v4 as uuidv4 } from 'uuid';
import { CreateVmRequest, CreateVmRequestSpecs } from 'src/devops/models/create';

export async function PullUseCase(telemetry: Telemetry, client: DevOps): Promise<boolean> {
  try {
    const event: AmplitudeEvent = {
      event: EVENT_PULL_USE_CASE,
      properties: [
        {
          name: 'operation',
          value: 'pull_virtual_machine'
        },
        {
          name: 'host',
          value: client.baseUrl
        },
      ]
    }

    core.info(`Creating a virtual machine`)
    let vmId = ''
    let host = ''
    const imageHost = new ImageHost()
    imageHost.parse(core.getInput('base_image'))
    const isValid = imageHost.validate()
    if (!isValid) {
      core.setFailed(`Invalid base image url ${core.getInput('base_image')}`)
      return false
    }

    const request = generateCreateMachineRequest(imageHost)
    const response = await client.createVm(request)
    if (response.id) {
      vmId = response.id
    }
    if (response.host) {
      host = response.host
    }

    core.setOutput('vm_id', vmId)
    core.setOutput('vm_name', request.name)
    core.setOutput('host', host)
    telemetry.track(event)
    return true
  } catch (error) {
    core.setFailed(`Error pulling virtual machine: ${error}`)
    return Promise.reject(error)
  }
}

function generateCreateMachineRequest(imageHost: ImageHost): CreateVmRequest {
  const request: CreateVmRequest = {
    name: `${imageHost.catalogId}_${uuidv4()}`,
    architecture: imageHost.architecture,
    start_on_create: true,
    catalog_manifest: {
      catalog_id: imageHost.catalogId,
      version: imageHost.version,
      connection: imageHost.getConnectionString(),
    }
  }
  const specs: CreateVmRequestSpecs = {}
  const requestCpus = core.getInput('machine_cpu_count')
  const requestMemory = core.getInput('machine_memory_size')
  if (requestCpus) {
    specs.cpu = requestCpus
  }
  if (requestMemory) {
    specs.memory = requestMemory
  }

  if (requestCpus || requestMemory) {
    request.catalog_manifest.specs = specs
  }

  return request
}

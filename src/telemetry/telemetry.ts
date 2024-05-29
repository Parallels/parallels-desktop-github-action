import * as amplitude from '@amplitude/analytics-node'

export const AMPLITUDE_API_KEY = ''
const AMPLITUDE_EVENT_PREFIX = 'PD-EXTENSION-'
export const EVENT_START = `${AMPLITUDE_EVENT_PREFIX}START`
export const EVENT_HEALTH_USE_CASE = `${AMPLITUDE_EVENT_PREFIX}HEALTH_USE_CASE`
export const EVENT_CREATE_USE_CASE = `${AMPLITUDE_EVENT_PREFIX}PULL_USE_CASE`
export const EVENT_CLONE_USE_CASE = `${AMPLITUDE_EVENT_PREFIX}CLONE_USE_CASE`
export const EVENT_START_USE_CASE = `${AMPLITUDE_EVENT_PREFIX}START_USE_CASE`
export const EVENT_STOP_USE_CASE = `${AMPLITUDE_EVENT_PREFIX}STOP_USE_CASE`
export const EVENT_DELETE_USE_CASE = `${AMPLITUDE_EVENT_PREFIX}DELETE_USE_CASE`
export const EVENT_RUN_USE_CASE = `${AMPLITUDE_EVENT_PREFIX}RUN_USE_CASE`
export const EVENT_ERROR = `${AMPLITUDE_EVENT_PREFIX}ERROR`

export interface AmplitudeEventProperty {
  name: string
  value: string
}

export interface AmplitudeEvent {
  event: string
  properties?: AmplitudeEventProperty[]
}

export const START_EVENT: AmplitudeEvent = {
  event: EVENT_START
}

export class Telemetry {
  private userId: string = 'github-action'
  private license: string = ''
  private enabled: boolean = true
  private amplitude_api_key: string = ''

  constructor(test: boolean = false) {
    this.init()
    if (test) {
      this.enabled = true
    }
  }

  async init() {
    if (!AMPLITUDE_API_KEY) {
      this.amplitude_api_key = process.env.AMPLITUDE_API_KEY || ''
    } else {
      this.amplitude_api_key = AMPLITUDE_API_KEY
    }

    if (!this.amplitude_api_key) {
      this.enabled = false
    }

    await amplitude.init(this.amplitude_api_key, {
      flushIntervalMillis: 100,
      logLevel: amplitude.Types.LogLevel.Error
    }).promise
  }

  setUserId(userId: string) {
    this.userId = userId
  }

  setLicense(license: string) {
    this.license = license
  }

  async track(event: AmplitudeEvent) {
    if (!this.enabled) {
      return
    }
    event.properties = event.properties || []

    if (this.license) {
      event.properties.push({
        name: 'license',
        value: this.license
      })
    }

    const properties: Record<string, string> = {}
    for (const property of event.properties ?? []) {
      properties[property.name] = property.value
    }

    amplitude.track(event.event, properties, {
      user_id: this.userId
    })
  }

  flush() {
    amplitude.flush()
  }
}

export default Telemetry

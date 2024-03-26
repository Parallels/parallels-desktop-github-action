import { Telemetry } from '../src/telemetry/telemetry'
import * as amplitude from '@amplitude/analytics-node' // Import the 'amplitude' module

describe('Telemetry', () => {
  let telemetry: Telemetry

  beforeEach(() => {
    telemetry = new Telemetry()
  })

  it('should set the user ID correctly', () => {
    const userId = 'test-user'
    telemetry.setUserId(userId)

    expect(telemetry['userId']).toBe(userId)
  })

  it('should set the license correctly', () => {
    const license = 'test-license'
    telemetry.setLicense(license)

    expect(telemetry['license']).toBe(license)
  })

  it('should track an event without license', () => {
    const event = {
      event: 'test-event',
      properties: [
        { name: 'property1', value: 'value1' },
        { name: 'property2', value: 'value2' }
      ]
    }
    const trackSpy = jest.spyOn(amplitude, 'track')

    telemetry.track(event)

    expect(trackSpy).toHaveBeenCalledWith(
      event.event,
      {
        property1: 'value1',
        property2: 'value2'
      },
      { user_id: 'github-action' }
    )
  })

  it('should track an event with license', () => {
    const event = {
      event: 'test-event',
      properties: [
        { name: 'property1', value: 'value1' },
        { name: 'property2', value: 'value2' }
      ]
    }
    const license = 'test-license'
    telemetry.setLicense(license)
    const trackSpy = jest.spyOn(amplitude, 'track')

    telemetry.track(event)

    expect(trackSpy).toHaveBeenCalledWith(
      event.event,
      {
        property1: 'value1',
        property2: 'value2',
        license: license
      },
      { user_id: 'github-action' }
    )
  })

  it('should flush the telemetry', () => {
    const flushSpy = jest.spyOn(amplitude, 'flush')

    telemetry.flush()

    expect(flushSpy).toHaveBeenCalled()
  })

  // Add more test cases to cover different scenarios
})

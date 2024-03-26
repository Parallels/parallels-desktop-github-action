import { run } from '../src/main'
import { Telemetry } from '../src/telemetry/telemetry'

jest.mock('../src/main', () => ({
  run: jest.fn()
}))

describe('index', () => {
  it('calls run when imported', async () => {
    require('../src/index')

    expect(run).toHaveBeenCalled()
  })
})

describe('Telemetry', () => {
  it('should create an instance of Telemetry', () => {
    const telemetry = new Telemetry()
    expect(telemetry).toBeInstanceOf(Telemetry)
  })
})

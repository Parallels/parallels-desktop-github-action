/**
 * The entrypoint for the action.
 */
import { Telemetry } from './telemetry/telemetry'
import { run } from './main'

console.log(`Initializing Amplitude...`)
const telemetry = new Telemetry()
telemetry.init()

console.log('Running action...')
run(telemetry)
  .then(() => {
    console.log('Action complete!')
    telemetry.flush()
  })
  .catch(error => {
    console.error('Action failed:', error)
    telemetry.flush()
    process.exit(1)
  })

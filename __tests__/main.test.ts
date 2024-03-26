// import { run } from '../src/main';
// import Telemetry from '../src/amplitude';
// import DevOps from '../src/devops/devops';
// import * as HealthCheck from '../src/use_cases/health';

// const healthCheckResult = 'up';

// const telemetryMock = jest.mock('../src/amplitude', () => {
//   return jest.fn().mockImplementation(() => {
//     return {
//       init: jest.fn().mockImplementation(() => Promise.resolve()),
//       track: jest.fn().mockImplementation(() => Promise.resolve()),
//       flush: jest.fn().mockImplementation(() => Promise.resolve()),
//     };
//   })
// });

// const devopsMock = jest.mock('../src/devops/devops', () => {
//   return jest.fn().mockImplementation(() => {
//     return {
//       getHealthStatus: jest.fn().mockImplementation(() => {
//         return Promise.resolve(healthCheckResult)
//       }),
//     };
//   });
// });

// // const healthUseCaseMock = jest.mock('../src/use_cases/health', () => {
// //   return jest.fn().mockImplementation(() => {
// //     return {
// //       HealthUseCase: jest.fn().mockImplementation(() => { return Promise.resolve(healthCheckResult) }),
// //     };
// //   });
// // });

// describe('run', () => {
//   beforeEach(() => {
//   });

//   it('should handle health-check operation', async () => {
//     const devops = devopsMock.spyOn(DevOps.prototype, 'getHealthStatus');
//     const telemetry = telemetryMock.spyOn(Telemetry.prototype, 'track');
//     // const healthUseCase = jest.spyOn(HealthCheck, 'HealthUseCase');

//     // Set the necessary inputs
//     process.env['INPUT_OPERATION'] = 'health-check';
//     process.env['INPUT_ORCHESTRATOR_URL'] = '';
//     process.env['INPUT_HOST_URL'] = 'example.com';
//     process.env['INPUT_INSECURE'] = 'false';

//     // Run the function
//     await run(new Telemetry());

//     // Add your assertions here
//     expect(devops).toHaveBeenCalled();
//     expect(telemetry).toHaveBeenCalledTimes(1);
//     // expect(healthUseCase).toHaveBeenCalled();
//   });

//   // Add more test cases for other operations
// });

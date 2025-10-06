import {
	type AmplitudeEvent,
	EVENT_RUN_USE_CASE,
	type Telemetry,
} from "../telemetry/telemetry";
import type DevOps from "../devops/devops";
import * as core from "@actions/core";
import type { ExecuteRequest } from "../devops/models/execute";

export async function RunUseCase(
	telemetry: Telemetry,
	client: DevOps,
): Promise<boolean> {
	const event: AmplitudeEvent = {
		event: EVENT_RUN_USE_CASE,
		properties: [
			{
				name: "operation",
				value: "execute_virtual_machine",
			},
			{
				name: "host",
				value: client.baseUrl,
			},
		],
	};

	try {
		const machine_name = core.getInput("machine_name");
		core.info(`Execution command on virtual machine ${machine_name}`);
		const command = core.getInput("run");
		if (!command) {
			core.setFailed(`Invalid command ${command}`);
			return false;
		}
		const lines = command.split("\n");

		core.info(`Checking the machine ${machine_name} status`);
		let machine = await client.getMachine(machine_name);
		core.debug(`Machine ${machine_name} status: ${JSON.stringify(machine)}`);
		if (machine.State !== "running") {
			for (let i = 0; i < 20; i++) {
				if (i > 0) {
					core.info(`Trying to start ${machine_name} [${i}/20]`);
				} else {
					core.info(`Trying to start ${machine_name}`);
				}

				await client.setMachineAction(machine_name, "start");
				machine = await client.getMachine(machine_name);
				if (machine.State === "running") {
					break;
				}
				core.info(
					`Machine ${machine_name} is stated, waiting 1s, old status: ${machine.State}`,
				);
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}

			if (machine.State !== "running") {
				core.setFailed(
					`Error executing command on virtual machine ${machine_name}: the current status is not running but instead ${machine.State}`,
				);
				return false;
			}
		}

		// waiting for machine to be ready
		let checkCommand = 'echo "ready"';
		if (machine.OS.startsWith("win")) {
			core.info(`Machine ${machine_name} is a Windows machine`);
			checkCommand = 'cmd.exe /C echo "ready"';
		}

		const checkCommandRequest: ExecuteRequest = {
			command: checkCommand,
		};

		for (let i = 0; i < 100; i++) {
			if (i > 0) {
				core.info(
					`Checking if virtual machine ${machine_name} is ready [${i}/100]`,
				);
			} else {
				core.info(`Checking if virtual machine ${machine_name} is ready`);
			}

			const response = await client.ExecuteOnVm(
				machine_name,
				checkCommandRequest,
			);
			if (response.exit_code === 0) {
				break;
			}
			core.info(
				`Machine ${machine_name} is not ready yet, waiting 1s, exit code: ${response.exit_code}`,
			);
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		for (let i = 0; i < 100; i++) {
			if (i > 0) {
				core.info(
					`Checking if virtual machine ${machine_name} has network [${i}/100]`,
				);
			} else {
				core.info(`Checking if virtual machine ${machine_name} has network`);
			}

			const response = await client.getMachineStatus(machine_name);

			if (response.ip_configured && response.ip_configured !== "-") {
				core.info(
					`Machine ${machine_name} has ip assigned ${response.ip_configured}`,
				);
				break;
			}

			core.info(
				`Machine ${machine_name} does not have ip assigned, waiting 1s`,
			);
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		let output = "";
		for (const line of lines) {
			// Skip empty lines or commented lines
			if (!line || line === "" || line === "\n") {
				continue;
			}
			// Skip commented lines
			if (line.startsWith("#")) {
				continue;
			}

			let max_attempts = Number(core.getInput("max_attempts")) || 1;
			if (max_attempts > 1) {
				core.debug(`Setting max attempts to ${max_attempts}`);
			}
			while (max_attempts > 0) {
				max_attempts--;
				core.info(`Executing command on virtual machine: ${line}`);

				const cloneRequest: ExecuteRequest = {
					command: line,
				};

				const response = await client.ExecuteOnVm(machine_name, cloneRequest);
				core.info(`Executed command virtual machine: ${line}`);
				if (response.stdout) {
					core.info(`Output:\n${response.stdout}`);
				}

				if (response.stderr || response.exit_code !== 0) {
					if (max_attempts === 0) {
						core.setOutput("stdout", response.stdout);
						core.setOutput("stderr", response.stderr);
						core.setFailed(
							`Error executing command on virtual machine: ${response.stderr}, exit code: ${response.exit_code}`,
						);
						return false;
					} else {
						core.info(
							`Retrying command execution on virtual machine: ${line} [${max_attempts} attempts left]`,
						);
					}
				} else {
					max_attempts = 0;
					output += response.stdout;
				}

				const timeoutSeconds = Number(core.getInput("timeout_seconds")) || 0;
				if (timeoutSeconds > 0 && max_attempts > 0) {
					core.info(
						`Waiting ${timeoutSeconds} seconds before executing the next command`,
					);
					await new Promise((resolve) =>
						setTimeout(resolve, timeoutSeconds * 1000),
					);
				}
			}
		}

		core.setOutput("stdout", output);
		telemetry.track(event);
		return true;
	} catch (error) {
		core.setFailed(`Error executing command virtual machine: ${error}`);
		event.properties?.push({
			name: "error",
			value: `${error}`,
		});
		await telemetry.track(event);
		return await Promise.reject(error);
	}
}

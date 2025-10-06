import {
	type AmplitudeEvent,
	EVENT_START_USE_CASE,
	type Telemetry,
} from "../telemetry/telemetry";
import type DevOps from "../devops/devops";
import * as core from "@actions/core";

export async function StartUseCase(
	telemetry: Telemetry,
	client: DevOps,
): Promise<boolean> {
	const event: AmplitudeEvent = {
		event: EVENT_START_USE_CASE,
		properties: [
			{
				name: "operation",
				value: "start_virtual_machine",
			},
			{
				name: "host",
				value: client.baseUrl,
			},
		],
	};

	try {
		const MACHINE_NAME = core.getInput("machine_name");
		core.info(`Starting virtual machine ${MACHINE_NAME}`);

		const machineStatus = await client.getMachineStatus(MACHINE_NAME);
		if (machineStatus.status === "running") {
			return true;
		}

		if (machineStatus.status === "stopped") {
			await client.setMachineAction(MACHINE_NAME, "start");
		} else {
			core.setFailed(
				`Error starting virtual machine ${MACHINE_NAME}: the current status is not stopped but instead ${machineStatus.status}`,
			);
			return false;
		}

		await telemetry.track(event);
		return true;
	} catch (error) {
		core.setFailed(`Error starting virtual machine: ${error}`);
		event.properties?.push({
			name: "error",
			value: `${error}`,
		});
		await telemetry.track(event);
		return await Promise.reject(error);
	}
}

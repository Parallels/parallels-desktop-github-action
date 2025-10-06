export interface ExecuteRequest {
	command: string;
}

export interface ExecuteResponse {
	stdout: string;
	stderr: string;
	exit_code: number;
}

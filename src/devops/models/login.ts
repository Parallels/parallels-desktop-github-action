export interface LoginResponse {
	email?: string;
	token?: string;
	expires_at?: number;
	apiKey: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

import axios from "axios";
import type {
	AxiosResponse,
	AxiosRequestConfig,
	RawAxiosRequestHeaders,
	AxiosError,
} from "axios";
import type { APIError } from "../devops/models/api_error";

export interface HttpHeader {
	name: string;
	value: string;
}

export interface HttpResponse<T> {
	StatusCode: number;
	Data: T;
}

enum HttpMethod {
	GET = "GET",
	POST = "POST",
	PUT = "PUT",
	DELETE = "DELETE",
}

class HttpClient {
	private readonly client: axios.AxiosInstance;

	constructor() {
		this.client = axios.create({
			timeout: 14400000,
		});
	}

	async get<T>(url: string, headers?: HttpHeader[]): Promise<HttpResponse<T>> {
		return await this.call<T>(HttpMethod.GET, url, undefined, headers);
	}

	async post<T>(
		url: string,
		data: unknown,
		headers?: HttpHeader[],
	): Promise<HttpResponse<T>> {
		return await this.call<T>(HttpMethod.POST, url, data, headers);
	}

	async put<T>(
		url: string,
		data: unknown,
		headers?: HttpHeader[],
	): Promise<HttpResponse<T>> {
		return await this.call<T>(HttpMethod.PUT, url, data, headers);
	}

	async delete<T>(
		url: string,
		headers?: HttpHeader[],
	): Promise<HttpResponse<T>> {
		return await this.call<T>(HttpMethod.DELETE, url, undefined, headers);
	}

	private async call<T>(
		method: HttpMethod,
		url: string,
		data: unknown,
		headers?: HttpHeader[],
	): Promise<HttpResponse<T>> {
		const config: AxiosRequestConfig = {};
		if (headers != null) {
			const requestHeaders: RawAxiosRequestHeaders = {};
			for (const header of headers) {
				requestHeaders[header.name] = header.value;
			}
			config.headers = requestHeaders;
		}
		try {
			let response: AxiosResponse<T>;
			switch (method) {
				case HttpMethod.GET:
					response = await this.client.get<T>(url, config);
					break;
				case HttpMethod.POST:
					response = await this.client.post<T>(url, data, config);
					break;
				case HttpMethod.PUT:
					response = await this.client.put<T>(url, data, config);
					break;
				case HttpMethod.DELETE:
					response = await this.client.delete<T>(url, config);
					break;
				default:
					throw new Error("Unsupported HTTP method");
			}

			const httpResponse = {
				StatusCode: response.status,
				Data: response.data,
			};
			return httpResponse;
		} catch (error) {
			const axiosError = error as AxiosError;
			const apiErrorResult: APIError = {
				message: "Unknown error",
				code: 500,
				clientErrorMessage: axiosError.message,
				clientErrorCode: axiosError.code ?? "UNKNOWN_ERROR_CODE",
			};
			if (axiosError?.response?.data != null) {
				const apiError = axiosError.response.data as APIError;
				apiErrorResult.message = apiError.message || "Unknown error";
				apiErrorResult.code = apiError.code ?? 500;
			}

			return await Promise.reject(apiErrorResult);
		}
	}
}

export default HttpClient;

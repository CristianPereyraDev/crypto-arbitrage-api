export class DatabaseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "DatabaseError";
	}
}

export class APIError extends Error {
	constructor(endpoint: string, apiName: string, reason: string) {
		super(`An error has ocurred at ${endpoint} due: ${reason}`);
		this.name = `APIError(${apiName})`;
	}
}

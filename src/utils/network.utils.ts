export async function fetchWithTimeout(
	resource: NodeJS.fetch.RequestInfo,
	options: NodeJS.fetch._RequestInit = {},
	timeout = 4000,
) {
	const response = await fetch(resource, {
		...options,
		signal: AbortSignal.timeout(Number(process.env.FETCH_TIMEOUT) || timeout),
	});

	return response;
}

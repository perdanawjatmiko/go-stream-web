let csrfToken = '';

export function setCsrfToken(token?: string) {
	if (token) csrfToken = token;
}

export function getCsrfToken(): string {
	return csrfToken;
}

export class ApiError extends Error {
	status: number;
	data: Record<string, unknown>;

	constructor(status: number, message: string, data: Record<string, unknown> = {}) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.data = data;
	}
}

export async function ensureCsrfToken(): Promise<string> {
	if (csrfToken) return csrfToken;
	const res = await fetch('/api/csrf', { credentials: 'same-origin' });
	if (res.ok) {
		const data = (await res.json()) as { csrf_token?: string };
		if (data.csrf_token) csrfToken = data.csrf_token;
	}
	return csrfToken;
}

export async function apiFetch<T>(
	path: string,
	options: {
		method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
		body?: unknown;
	} = {}
): Promise<T> {
	const method = options.method ?? 'GET';
	const headers: Record<string, string> = {
		Accept: 'application/json'
	};

	if (method !== 'GET') {
		const token = await ensureCsrfToken();
		if (token) {
			headers['X-CSRF-Token'] = token;
		}
	}

	let serializedBody: string | undefined;
	if (options.body !== undefined) {
		headers['Content-Type'] = 'application/json';
		serializedBody = JSON.stringify(options.body);
	}

	let res = await fetch(path, {
		method,
		headers,
		body: serializedBody,
		credentials: 'same-origin'
	});

	// Retry once if CSRF cookie rotated/expired
	if (res.status === 403 && method !== 'GET') {
		csrfToken = '';
		const freshToken = await ensureCsrfToken();
		if (freshToken) {
			headers['X-CSRF-Token'] = freshToken;
			res = await fetch(path, {
				method,
				headers,
				body: serializedBody,
				credentials: 'same-origin'
			});
		}
	}

	const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
	if (typeof data.csrf_token === 'string') {
		csrfToken = data.csrf_token;
	}

	if (!res.ok) {
		const msg =
			typeof data.error === 'string'
				? data.error
				: `Permintaan gagal (${res.status})`;
		throw new ApiError(res.status, msg, data);
	}

	return data as T;
}

export function sendWatchBeacon(videoId: number, seconds: number) {
	if (!csrfToken || seconds <= 0 || videoId <= 0) return;
	const params = new URLSearchParams({
		csrf_token: csrfToken,
		video_id: String(videoId),
		seconds: String(Math.min(10, Math.floor(seconds)))
	});
	navigator.sendBeacon('/api/video/watch', params);
}

export function formatDuration(seconds: number): string {
	const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
	const hours = Math.floor(value / 3600);
	const mins = Math.floor((value % 3600) / 60);
	const secs = value % 60;
	if (hours > 0) {
		return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	}
	return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatDateTime(iso: string): string {
	if (!iso) return '-';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return new Intl.DateTimeFormat('id-ID', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	}).format(date);
}

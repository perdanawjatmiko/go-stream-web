export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
	id: number;
	kind: ToastKind;
	message: string;
}

let nextId = 1;
export const toastState = $state<{ items: ToastItem[] }>({ items: [] });

function push(kind: ToastKind, message: string, duration = 3800) {
	const id = nextId++;
	toastState.items.push({ id, kind, message });
	if (duration > 0 && typeof window !== 'undefined') {
		window.setTimeout(() => dismissToast(id), duration);
	}
}

export function dismissToast(id: number) {
	const idx = toastState.items.findIndex((t) => t.id === id);
	if (idx !== -1) {
		toastState.items.splice(idx, 1);
	}
}

export const toast = {
	success: (message: string) => push('success', message),
	error: (message: string) => push('error', message, 5000),
	info: (message: string) => push('info', message)
};

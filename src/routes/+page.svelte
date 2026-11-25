<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { apiFetch, setCsrfToken } from '#lib/api.js';
	import type { AuthMeResponse } from '#lib/types.js';

	onMount(async () => {
		try {
			const me = await apiFetch<AuthMeResponse>('/api/auth/me');
			setCsrfToken(me.csrf_token);
			if (me.authenticated) {
				await goto('/video', { replaceState: true });
			} else {
				await goto('/login', { replaceState: true });
			}
		} catch {
			await goto('/login', { replaceState: true });
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-slate-50">
	<div class="flex items-center gap-3 text-sm font-medium text-slate-500">
		<span class="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></span>
		Memuat portal webinar...
	</div>
</div>

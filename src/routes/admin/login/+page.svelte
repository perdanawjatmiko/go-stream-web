<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ApiError, apiFetch, setCsrfToken } from '#lib/api.js';
	import Icon from '#lib/components/Icon.svelte';
	import type { Admin, AdminAuthMeResponse } from '#lib/types.js';

	let checking = $state(true);
	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let submitting = $state(false);
	let errorMessage = $state('');

	onMount(async () => {
		try {
			const me = await apiFetch<AdminAuthMeResponse>('/api/admin/auth/me');
			setCsrfToken(me.csrf_token);
			if (me.authenticated) {
				await goto('/admin', { replaceState: true });
				return;
			}
		} catch {
			// Ignore initial check error
		} finally {
			checking = false;
		}
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (submitting) return;
		errorMessage = '';
		submitting = true;
		try {
			await apiFetch<{ admin: Admin; csrf_token: string }>('/api/admin/auth/login', {
				method: 'POST',
				body: { email: email.trim(), password }
			});
			await goto('/admin', { replaceState: true });
		} catch (err) {
			errorMessage =
				err instanceof ApiError
					? err.message
					: 'Gagal terhubung ke server. Periksa koneksi jaringan Anda.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Login Administrator | KDKMP</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
	<div
		class="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_55%)]"
	></div>

	{#if checking}
		<div class="relative flex items-center gap-3 text-sm font-medium text-slate-400">
			<span
				class="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"
			></span>
			Memeriksa sesi administrator...
		</div>
	{:else}
		<main
			class="relative w-full max-w-[420px] rounded-2xl border border-slate-800 bg-slate-900 p-7 text-slate-100 shadow-2xl sm:p-8"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2.5">
					<div
						class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white"
					>
						<Icon name="shield" class="h-5 w-5" />
					</div>
					<span class="text-sm font-extrabold tracking-widest text-emerald-400">KDKMP ADMIN</span>
				</div>
				<span
					class="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-slate-300 uppercase"
				>
					Portal Kontrol
				</span>
			</div>

			<h1 class="mt-6 text-2xl font-bold tracking-tight text-white">Masuk Administrator</h1>
			<p class="mt-1 text-sm text-slate-400">
				Kelola tayangan webinar, peserta, kuis langsung, dan laporan kehadiran.
			</p>

			{#if errorMessage}
				<div
					class="mt-4 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-950/60 px-3.5 py-3 text-sm text-red-200"
					role="alert"
				>
					<Icon name="alert" class="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
					<span>{errorMessage}</span>
				</div>
			{/if}

			<form class="mt-5 space-y-4" onsubmit={handleSubmit}>
				<div>
					<label for="admin-email" class="block text-sm font-semibold text-slate-300">
						Email Administrator
					</label>
					<input
						id="admin-email"
						type="email"
						autocomplete="username"
						placeholder="admin@domain.com"
						required
						maxlength="254"
						bind:value={email}
						class="mt-1.5 block w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/20 focus:outline-none"
					/>
				</div>

				<div>
					<label for="admin-password" class="block text-sm font-semibold text-slate-300">
						Password
					</label>
					<div class="relative mt-1.5">
						<input
							id="admin-password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="current-password"
							placeholder="Masukkan password"
							required
							maxlength="128"
							bind:value={password}
							class="block w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pr-11 pl-3.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/20 focus:outline-none"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
							class="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200"
						>
							<Icon name={showPassword ? 'eye-off' : 'eye'} class="h-4 w-4" />
						</button>
					</div>
				</div>

				<button
					type="submit"
					disabled={submitting}
					class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500 focus:ring-3 focus:ring-emerald-500/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
				>
					{#if submitting}
						<span
							class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></span>
						Memverifikasi...
					{:else}
						MASUK DASHBOARD
					{/if}
				</button>
			</form>
		</main>
	{/if}
</div>

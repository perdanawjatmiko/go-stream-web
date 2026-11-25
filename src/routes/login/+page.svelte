<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ApiError, apiFetch, setCsrfToken } from '#lib/api.js';
	import Icon from '#lib/components/Icon.svelte';
	import type { AuthMeResponse, User } from '#lib/types.js';

	let checking = $state(true);
	let siteEnabled = $state(true);
	let username = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let submitting = $state(false);
	let errorMessage = $state('');

	onMount(async () => {
		try {
			const me = await apiFetch<AuthMeResponse>('/api/auth/me');
			setCsrfToken(me.csrf_token);
			siteEnabled = me.site_enabled;
			if (me.authenticated) {
				await goto('/video', { replaceState: true });
				return;
			}
		} catch {
			// Ignore initial check error; form will still fetch CSRF when needed
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
			await apiFetch<{ user: User; csrf_token: string }>('/api/auth/login', {
				method: 'POST',
				body: { username: username.trim(), password }
			});
			await goto('/video', { replaceState: true });
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 404 && err.data.site_enabled === false) {
					siteEnabled = false;
				} else {
					errorMessage = err.message;
				}
			} else {
				errorMessage = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
			}
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Login Peserta | KDKMP</title>
</svelte:head>

<div
	class="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-slate-50 to-sky-50 px-4 py-10"
>
	<div
		class="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl"
	></div>
	<div
		class="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl"
	></div>

	{#if checking}
		<div class="flex items-center gap-3 text-sm font-medium text-slate-500">
			<span
				class="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"
			></span>
			Memeriksa sesi...
		</div>
	{:else if !siteEnabled}
		<main
			class="relative w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xl shadow-slate-900/5"
		>
			<div
				class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
			>
				<Icon name="video" class="h-6 w-6" />
			</div>
			<div class="text-xs font-extrabold tracking-widest text-emerald-700 uppercase">KDKMP</div>
			<h1 class="mt-2 text-xl font-bold text-slate-900">Streaming Sedang Offline</h1>
			<p class="mt-2 text-sm leading-relaxed text-slate-600">
				Saat ini tidak ada streaming yang berlangsung. Silakan kembali sesuai jadwal acara yang telah
				diinformasikan panitia.
			</p>
		</main>
	{:else}
		<main
			class="relative w-full max-w-[420px] rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-8"
		>
			<div class="flex items-center gap-2.5">
				<div
					class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-sm"
				>
					<Icon name="video" class="h-5 w-5" />
				</div>
				<span class="text-sm font-extrabold tracking-widest text-emerald-800">KDKMP</span>
			</div>

			<h1 class="mt-5 text-2xl font-bold tracking-tight text-slate-900">Login Peserta</h1>
			<p class="mt-1 text-sm text-slate-500">Masuk untuk mengakses ruang webinar pembelajaran.</p>

			{#if errorMessage}
				<div
					class="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800"
					role="alert"
				>
					<Icon name="alert" class="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
					<span>{errorMessage}</span>
				</div>
			{/if}

			<form class="mt-5 space-y-4" onsubmit={handleSubmit}>
				<div>
					<label for="username" class="block text-sm font-semibold text-slate-700">
						Email atau Nomor HP
					</label>
					<input
						id="username"
						name="username"
						type="text"
						autocomplete="username"
						placeholder="contoh@email.com / 0812xxxx"
						required
						maxlength="254"
						bind:value={username}
						class="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/20 focus:outline-none"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-semibold text-slate-700">Password</label>
					<div class="relative mt-1.5">
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="current-password"
							placeholder="Masukkan password"
							required
							maxlength="128"
							bind:value={password}
							class="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-11 pl-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/20 focus:outline-none"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
							aria-pressed={showPassword}
							class="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
						>
							<Icon name={showPassword ? 'eye-off' : 'eye'} class="h-4 w-4" />
						</button>
					</div>
				</div>

				<button
					type="submit"
					disabled={submitting}
					class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 focus:ring-3 focus:ring-emerald-500/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-65"
				>
					{#if submitting}
						<span
							class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></span>
						Memverifikasi...
					{:else}
						MASUK WEBINAR
					{/if}
				</button>
			</form>
		</main>
	{/if}
</div>

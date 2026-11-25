<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { apiFetch, setCsrfToken } from '#lib/api.js';
	import Icon, { type IconName } from '#lib/components/Icon.svelte';
	import type { Admin, AdminAuthMeResponse } from '#lib/types.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	let adminUser = $state<Admin | null>(null);
	let verifying = $state(true);
	let mobileOpen = $state(false);

	let isLoginRoute = $derived(page.url.pathname === '/admin/login');

	const navItems: { href: string; label: string; icon: IconName }[] = [
		{ href: '/admin', label: 'Dashboard', icon: 'dashboard' },
		{ href: '/admin/videos', label: 'Manajemen Video', icon: 'video' },
		{ href: '/admin/quizzes', label: 'Studio Kuis Live', icon: 'quiz' },
		{ href: '/admin/quizzes/bank', label: 'Daftar Bank Soal', icon: 'list' },
		{ href: '/admin/users', label: 'Data Peserta', icon: 'users' },
		{ href: '/admin/attendance', label: 'Laporan Kehadiran', icon: 'attendance' },
		{ href: '/admin/questions', label: 'Pertanyaan Masuk', icon: 'question' }
	];

	function isActive(href: string, currentPath: string): boolean {
		if (href === '/admin') return currentPath === '/admin';
		if (href === '/admin/quizzes') return currentPath === '/admin/quizzes';
		if (href === '/admin/quizzes/bank') {
			return (
				currentPath === '/admin/quizzes/bank' ||
				(currentPath.startsWith('/admin/quizzes/') && currentPath.endsWith('/answers'))
			);
		}
		return currentPath === href || currentPath.startsWith(`${href}/`);
	}

	$effect(() => {
		const currentPath = page.url.pathname;
		mobileOpen = false;
		if (currentPath === '/admin/login') {
			verifying = false;
			return;
		}
		if (adminUser) {
			verifying = false;
			return;
		}
		verifying = true;
		apiFetch<AdminAuthMeResponse>('/api/admin/auth/me')
			.then((me) => {
				setCsrfToken(me.csrf_token);
				if (!me.authenticated || !me.admin) {
					goto('/admin/login', { replaceState: true });
					return;
				}
				adminUser = me.admin;
				verifying = false;
			})
			.catch(() => {
				goto('/admin/login', { replaceState: true });
			});
	});

	async function handleLogout() {
		try {
			await apiFetch('/api/admin/auth/logout', { method: 'POST', body: {} });
		} finally {
			adminUser = null;
			await goto('/admin/login', { replaceState: true });
		}
	}
</script>

{#if isLoginRoute}
	{@render children()}
{:else if verifying}
	<div class="flex min-h-screen items-center justify-center bg-slate-50">
		<div class="flex items-center gap-3 text-sm font-medium text-slate-500">
			<span
				class="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"
			></span>
			Memuat portal administrator...
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-slate-50 lg:flex">
		<!-- Mobile Header -->
		<header
			class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden"
		>
			<a href="/admin" class="flex items-center gap-2">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white">
					<Icon name="shield" class="h-4 w-4" />
				</div>
				<span class="text-sm font-extrabold tracking-wider text-slate-900">KDKMP ADMIN</span>
			</a>
			<button
				type="button"
				onclick={() => (mobileOpen = !mobileOpen)}
				class="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
				aria-label="Menu navigasi"
			>
				<Icon name={mobileOpen ? 'close' : 'menu'} class="h-5 w-5" />
			</button>
		</header>

		<!-- Mobile Backdrop -->
		{#if mobileOpen}
			<button
				type="button"
				onclick={() => (mobileOpen = false)}
				class="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
				aria-label="Tutup menu"
			></button>
		{/if}

		<!-- Sidebar -->
		<aside
			class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 {mobileOpen
				? 'translate-x-0'
				: '-translate-x-full'}"
		>
			<div class="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white">
					<Icon name="shield" class="h-4 w-4" />
				</div>
				<div>
					<div class="text-xs font-extrabold tracking-widest text-emerald-800">KDKMP STREAM STUDIO</div>
					<div class="text-[11px] font-medium text-slate-400">Administrator</div>
				</div>
			</div>

			<nav class="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Navigasi administrator">
				{#each navItems as item (item.href)}
					{@const active = isActive(item.href, page.url.pathname)}
					<a
						href={item.href}
						class="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition {active
							? 'bg-emerald-50 text-emerald-800'
							: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
					>
						<Icon
							name={item.icon}
							class="h-4 w-4 shrink-0 {active ? 'text-emerald-700' : 'text-slate-400'}"
						/>
						<span>{item.label}</span>
					</a>
				{/each}
			</nav>

			{#if adminUser}
				<div class="border-t border-slate-100 p-4">
					<div class="mb-3 truncate px-1">
						<div class="truncate text-xs font-bold text-slate-800">{adminUser.name}</div>
						<div class="truncate text-[11px] text-slate-500">{adminUser.email}</div>
					</div>
					<button
						type="button"
						onclick={handleLogout}
						class="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
					>
						<Icon name="logout" class="h-3.5 w-3.5" />
						<span>Logout</span>
					</button>
				</div>
			{/if}
		</aside>

		<!-- Main Content -->
		<div class="min-w-0 flex-1">
			<main class="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
				{@render children()}
			</main>
		</div>
	</div>
{/if}

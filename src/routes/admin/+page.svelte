<script lang="ts">
	import { onMount } from 'svelte';
	import { apiFetch } from '#lib/api.js';
	import Icon from '#lib/components/Icon.svelte';
	import { toast } from '#lib/toast.svelte.js';
	import type { Admin, DashboardStats, Video } from '#lib/types.js';

	let loading = $state(true);
	let adminInfo = $state<Admin | null>(null);
	let stats = $state<DashboardStats>({
		total_users: 0,
		active_user_sessions: 0,
		total_videos: 0
	});
	let activeVideo = $state<Video | null>(null);

	onMount(async () => {
		try {
			const res = await apiFetch<{
				admin: Admin;
				stats: DashboardStats;
				active_video: Video | null;
			}>('/api/admin/dashboard');
			adminInfo = res.admin;
			stats = res.stats;
			activeVideo = res.active_video;
		} catch {
			toast.error('Gagal memuat ringkasan dashboard.');
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Dashboard | KDKMP Admin</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
		<p class="mt-1 text-sm text-slate-500">
			Selamat datang{adminInfo ? `, ${adminInfo.name}` : ''}. Pantau status tayangan dan aktivitas
			peserta secara langsung.
		</p>
	</div>

	<!-- Stat Cards -->
	<section class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<article class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
			<div class="flex items-center justify-between text-slate-500">
				<span class="text-xs font-semibold tracking-wide uppercase">Total Peserta</span>
				<Icon name="users" class="h-4 w-4 text-slate-400" />
			</div>
			<div class="mt-4 text-3xl font-extrabold text-slate-900 tabular-nums">
				{loading ? '—' : stats.total_users.toLocaleString('id-ID')}
			</div>
			<p class="mt-1 text-xs text-slate-400">Akun terdaftar di sistem</p>
		</article>

		<article class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
			<div class="flex items-center justify-between text-slate-500">
				<span class="text-xs font-semibold tracking-wide uppercase">Sesi Login Aktif</span>
				<span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
			</div>
			<div class="mt-4 text-3xl font-extrabold text-emerald-700 tabular-nums">
				{loading ? '—' : stats.active_user_sessions.toLocaleString('id-ID')}
			</div>
			<p class="mt-1 text-xs text-slate-400">Sesi peserta belum kedaluwarsa</p>
		</article>

		<article class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
			<div class="flex items-center justify-between text-slate-500">
				<span class="text-xs font-semibold tracking-wide uppercase">Katalog Video</span>
				<Icon name="video" class="h-4 w-4 text-slate-400" />
			</div>
			<div class="mt-4 text-3xl font-extrabold text-slate-900 tabular-nums">
				{loading ? '—' : stats.total_videos.toLocaleString('id-ID')}
			</div>
			<p class="mt-1 text-xs text-slate-400">Total sesi webinar tersimpan</p>
		</article>

		<article class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
			<div class="flex items-center justify-between text-slate-500">
				<span class="text-xs font-semibold tracking-wide uppercase">Status Tayangan</span>
				<Icon name="shield" class="h-4 w-4 text-slate-400" />
			</div>
			<div class="mt-4 flex items-center gap-2">
				{#if loading}
					<span class="text-2xl font-bold text-slate-400">—</span>
				{:else if activeVideo}
					<span
						class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-600/20"
					>
						<span class="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
						LIVE AKTIF
					</span>
				{:else}
					<span
						class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
					>
						TIDAK ADA AKTIF
					</span>
				{/if}
			</div>
			<p class="mt-2 text-xs text-slate-400">Maksimal 1 video aktif serentak</p>
		</article>
	</section>

	<!-- Active Webinar Card -->
	<section class="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
		<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
			<div>
				<h2 class="text-base font-bold text-slate-900">Webinar Sedang Aktif</h2>
				<p class="text-xs text-slate-500">
					Tayangan yang saat ini dilihat oleh peserta di halaman ruang webinar.
				</p>
			</div>
			<div class="flex flex-wrap gap-2.5">
				<a
					href="/admin/videos"
					class="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800"
				>
					<Icon name="video" class="h-4 w-4" />
					<span>Kelola Video</span>
				</a>
				<a
					href="/admin/quizzes"
					class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
				>
					<Icon name="quiz" class="h-4 w-4" />
					<span>Studio Kuis Live</span>
				</a>
			</div>
		</div>

		{#if !loading && activeVideo}
			<div class="mt-5 rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-4 sm:p-5">
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<div class="sm:col-span-2">
						<div class="text-xs font-semibold text-slate-500">Judul Webinar</div>
						<div class="mt-1 text-base font-bold text-slate-900">{activeVideo.title}</div>
						{#if activeVideo.description}
							<p class="mt-1.5 text-xs leading-relaxed text-slate-600">
								{activeVideo.description}
							</p>
						{/if}
					</div>
					<div>
						<div class="text-xs font-semibold text-slate-500">YouTube Video ID</div>
						<code
							class="mt-1 inline-block rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800"
						>
							{activeVideo.youtube_video_id}
						</code>
					</div>
				</div>
			</div>
		{:else if !loading}
			<div class="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
				<p class="text-sm font-medium text-slate-600">Belum ada webinar yang diaktifkan.</p>
				<p class="mt-1 text-xs text-slate-400">
					Peserta yang login saat ini akan melihat halaman "Video Belum Tersedia".
				</p>
			</div>
		{/if}
	</section>
</div>

<script lang="ts">
	import { onMount } from 'svelte';
	import { apiFetch, formatDateTime, formatDuration } from '#lib/api.js';
	import Icon from '#lib/components/Icon.svelte';
	import { toast } from '#lib/toast.svelte.js';
	import type { AttendanceEntry, Pagination, Video } from '#lib/types.js';

	let loading = $state(true);
	let entries = $state<AttendanceEntry[]>([]);
	let videos = $state<Video[]>([]);
	let query = $state('');
	let videoId = $state('0');
	let date = $state('');
	let pagination = $state<Pagination>({
		page: 1,
		pages: 1,
		total: 0,
		limit: 25,
		prev: 0,
		next: 2,
		has_prev: false,
		has_next: false
	});

	function buildQueryParams(page?: number): URLSearchParams {
		const params = new URLSearchParams();
		if (query.trim()) params.set('q', query.trim());
		if (videoId !== '0' && videoId !== '') params.set('video_id', videoId);
		if (date) params.set('date', date);
		if (page) params.set('page', String(page));
		return params;
	}

	let exportHref = $derived(`/api/admin/attendance/export?${buildQueryParams().toString()}`);

	async function loadAttendance(page = 1) {
		loading = true;
		try {
			const res = await apiFetch<{
				entries: AttendanceEntry[];
				videos: Video[];
				pagination: Pagination;
			}>(`/api/admin/attendance?${buildQueryParams(page).toString()}`);
			entries = res.entries;
			videos = res.videos;
			pagination = res.pagination;
		} catch {
			toast.error('Gagal memuat laporan kehadiran.');
		} finally {
			loading = false;
		}
	}

	onMount(() => loadAttendance(1));

	function handleFilter(event: SubmitEvent) {
		event.preventDefault();
		loadAttendance(1);
	}
</script>

<svelte:head>
	<title>Laporan Kehadiran | KDKMP Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-slate-900">Laporan Kehadiran</h1>
			<p class="mt-1 text-sm text-slate-500">
				Total {pagination.total.toLocaleString('id-ID')} catatan kehadiran dan durasi tonton peserta.
			</p>
		</div>
		<a
			href={exportHref}
			class="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 sm:text-sm"
		>
			<Icon name="download" class="h-4 w-4" />
			<span>Export Excel (.xlsx)</span>
		</a>
	</div>

	<!-- Filter Bar -->
	<form
		onsubmit={handleFilter}
		class="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-5"
	>
		<div class="lg:col-span-2">
			<label for="att-q" class="block text-[11px] font-bold text-slate-500 uppercase">
				Cari Peserta
			</label>
			<input
				id="att-q"
				type="search"
				bind:value={query}
				placeholder="Nama, email, atau nomor HP..."
				class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
			/>
		</div>

		<div>
			<label for="att-vid" class="block text-[11px] font-bold text-slate-500 uppercase">
				Webinar
			</label>
			<select
				id="att-vid"
				bind:value={videoId}
				class="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
			>
				<option value="0">Semua Webinar</option>
				{#each videos as v (v.id)}
					<option value={String(v.id)}>{v.title}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="att-date" class="block text-[11px] font-bold text-slate-500 uppercase">
				Tanggal Login
			</label>
			<input
				id="att-date"
				type="date"
				bind:value={date}
				class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
			/>
		</div>

		<div class="flex items-end gap-2">
			<button
				type="submit"
				class="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 sm:text-sm"
			>
				Filter
			</button>
			<button
				type="button"
				onclick={() => {
					query = '';
					videoId = '0';
					date = '';
					loadAttendance(1);
				}}
				class="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
			>
				Reset
			</button>
		</div>
	</form>

	<!-- Table -->
	<div class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
		<div class="overflow-x-auto">
			<table class="w-full border-collapse text-left text-sm">
				<thead>
					<tr class="border-b border-slate-200 bg-slate-50/80 text-xs font-bold tracking-wider text-slate-500 uppercase">
						<th class="px-5 py-3.5">Peserta</th>
						<th class="px-5 py-3.5">Kontak</th>
						<th class="px-5 py-3.5">Webinar</th>
						<th class="px-5 py-3.5">Waktu Login</th>
						<th class="px-5 py-3.5">Durasi Menonton</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#if loading}
						<tr>
							<td colspan="5" class="px-5 py-10 text-center text-sm text-slate-400">
								Memuat data kehadiran...
							</td>
						</tr>
					{:else if entries.length === 0}
						<tr>
							<td colspan="5" class="px-5 py-12 text-center text-sm text-slate-500">
								Belum ada data kehadiran untuk filter ini.
							</td>
						</tr>
					{:else}
						{#each entries as e (e.id)}
							<tr class="hover:bg-slate-50/60">
								<td class="px-5 py-3.5 font-semibold text-slate-900">{e.user_name}</td>
								<td class="px-5 py-3.5">
									<div class="text-xs text-slate-700">{e.email}</div>
									{#if e.phone}
										<div class="font-mono text-[11px] text-slate-400">{e.phone}</div>
									{/if}
								</td>
								<td class="max-w-xs truncate px-5 py-3.5 text-slate-700">{e.webinar_title}</td>
								<td class="px-5 py-3.5 text-xs whitespace-nowrap text-slate-500">
									{formatDateTime(e.login_at)}
								</td>
								<td class="px-5 py-3.5 font-mono text-xs font-bold text-emerald-700 tabular-nums">
									{formatDuration(e.watched_seconds)}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		{#if pagination.pages > 1}
			<div class="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 text-xs text-slate-600">
				<span>Halaman <strong>{pagination.page}</strong> dari <strong>{pagination.pages}</strong></span>
				<div class="flex gap-2">
					<button
						type="button"
						disabled={!pagination.has_prev || loading}
						onclick={() => loadAttendance(pagination.prev)}
						class="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:opacity-40"
					>
						← Sebelumnya
					</button>
					<button
						type="button"
						disabled={!pagination.has_next || loading}
						onclick={() => loadAttendance(pagination.next)}
						class="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:opacity-40"
					>
						Berikutnya →
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

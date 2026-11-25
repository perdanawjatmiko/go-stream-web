<script lang="ts">
	import { onMount } from 'svelte';
	import { apiFetch, formatDateTime } from '#lib/api.js';
	import Icon from '#lib/components/Icon.svelte';
	import { toast } from '#lib/toast.svelte.js';
	import type { Pagination, QuestionEntry, Video } from '#lib/types.js';

	let loading = $state(true);
	let entries = $state<QuestionEntry[]>([]);
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

	let exportHref = $derived(`/api/admin/questions/export?${buildQueryParams().toString()}`);

	async function loadQuestions(page = 1) {
		loading = true;
		try {
			const res = await apiFetch<{
				entries: QuestionEntry[];
				videos: Video[];
				pagination: Pagination;
			}>(`/api/admin/questions?${buildQueryParams(page).toString()}`);
			entries = res.entries;
			videos = res.videos;
			pagination = res.pagination;
		} catch {
			toast.error('Gagal memuat daftar pertanyaan peserta.');
		} finally {
			loading = false;
		}
	}

	onMount(() => loadQuestions(1));

	function handleFilter(event: SubmitEvent) {
		event.preventDefault();
		loadQuestions(1);
	}
</script>

<svelte:head>
	<title>Pertanyaan Masuk | KDKMP Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-slate-900">Pertanyaan Peserta</h1>
			<p class="mt-1 text-sm text-slate-500">
				Total {pagination.total.toLocaleString('id-ID')} pertanyaan masuk dari seluruh sesi webinar.
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
			<label for="q-search" class="block text-[11px] font-bold text-slate-500 uppercase">
				Cari Peserta / Isi Pertanyaan
			</label>
			<input
				id="q-search"
				type="search"
				bind:value={query}
				placeholder="Nama, email, atau kata kunci pertanyaan..."
				class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
			/>
		</div>

		<div>
			<label for="q-vid" class="block text-[11px] font-bold text-slate-500 uppercase">
				Webinar
			</label>
			<select
				id="q-vid"
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
			<label for="q-date" class="block text-[11px] font-bold text-slate-500 uppercase">
				Tanggal Kirim
			</label>
			<input
				id="q-date"
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
					loadQuestions(1);
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
						<th class="px-5 py-3.5">Webinar</th>
						<th class="px-5 py-3.5">Slot</th>
						<th class="px-5 py-3.5">Isi Pertanyaan</th>
						<th class="px-5 py-3.5">Waktu Kirim</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#if loading}
						<tr>
							<td colspan="5" class="px-5 py-10 text-center text-sm text-slate-400">
								Memuat daftar pertanyaan...
							</td>
						</tr>
					{:else if entries.length === 0}
						<tr>
							<td colspan="5" class="px-5 py-12 text-center text-sm text-slate-500">
								Belum ada pertanyaan peserta untuk filter ini.
							</td>
						</tr>
					{:else}
						{#each entries as e (e.id)}
							<tr class="align-top hover:bg-slate-50/60">
								<td class="px-5 py-4 whitespace-nowrap">
									<div class="font-semibold text-slate-900">{e.user_name}</div>
									<div class="text-xs text-slate-500">{e.email}</div>
								</td>
								<td class="max-w-[180px] truncate px-5 py-4 text-xs text-slate-600">
									{e.webinar_title}
								</td>
								<td class="px-5 py-4 whitespace-nowrap">
									<span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
										#{e.number}
									</span>
								</td>
								<td class="min-w-[280px] max-w-md px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap break-words text-slate-800">
									{e.text}
								</td>
								<td class="px-5 py-4 text-xs whitespace-nowrap text-slate-500">
									{formatDateTime(e.created_at)}
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
						onclick={() => loadQuestions(pagination.prev)}
						class="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:opacity-40"
					>
						← Sebelumnya
					</button>
					<button
						type="button"
						disabled={!pagination.has_next || loading}
						onclick={() => loadQuestions(pagination.next)}
						class="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:opacity-40"
					>
						Berikutnya →
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

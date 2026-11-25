<script lang="ts">
	import { onMount } from 'svelte';
	import { ApiError, apiFetch } from '#lib/api.js';
	import Icon from '#lib/components/Icon.svelte';
	import { toast } from '#lib/toast.svelte.js';
	import type { AdminQuizEntry, Video } from '#lib/types.js';

	let loading = $state(true);
	let entries = $state<AdminQuizEntry[]>([]);
	let videos = $state<Video[]>([]);

	let searchQuery = $state('');
	let filterVideoId = $state('0');
	let filterStatus = $state<'all' | 'published' | 'draft'>('all');
	let publishingId = $state<number | null>(null);

	function truncateQuestion(text: string, maxChars = 250): string {
		const chars = Array.from(text);
		if (chars.length <= maxChars) return text;
		return chars.slice(0, maxChars).join('') + '…';
	}

	let filteredEntries = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		return entries.filter((item) => {
			if (filterVideoId !== '0' && String(item.video_id) !== filterVideoId) return false;
			if (filterStatus === 'published' && !item.is_published) return false;
			if (filterStatus === 'draft' && item.is_published) return false;
			if (
				q &&
				!item.question.toLowerCase().includes(q) &&
				!item.video_title.toLowerCase().includes(q)
			) {
				return false;
			}
			return true;
		});
	});

	async function loadQuizzes() {
		loading = true;
		try {
			const res = await apiFetch<{
				entries: AdminQuizEntry[];
				videos: Video[];
			}>('/api/admin/quizzes');
			entries = res.entries;
			videos = res.videos;
		} catch {
			toast.error('Gagal memuat daftar bank soal.');
		} finally {
			loading = false;
		}
	}

	onMount(loadQuizzes);

	async function handlePublish(q: AdminQuizEntry) {
		if (publishingId !== null) return;
		publishingId = q.id;
		try {
			await apiFetch(`/api/admin/quizzes/${q.id}/publish`, {
				method: 'POST',
				body: {}
			});
			toast.success('Kuis diterbitkan dan dikirim real-time ke layar peserta!');
			await loadQuizzes();
		} catch (err) {
			toast.error(err instanceof ApiError ? err.message : 'Gagal menerbitkan kuis.');
		} finally {
			publishingId = null;
		}
	}
</script>

<svelte:head>
	<title>Daftar Bank Soal | KDKMP Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-slate-900">Daftar Bank Soal</h1>
			<p class="mt-1 text-sm text-slate-500">
				Total {entries.length.toLocaleString('id-ID')} kuis tercatat. Terbitkan soal draft atau pantau
				jawaban yang diterima dari peserta.
			</p>
		</div>

		<a
			href="/admin/quizzes"
			class="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800 sm:text-sm"
		>
			<Icon name="plus" class="h-4 w-4" />
			<span>Buat Soal Baru</span>
		</a>
	</div>

	<!-- Filter Bar -->
	<div
		class="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-4"
	>
		<div class="lg:col-span-2">
			<label for="bank-search" class="block text-[11px] font-bold text-slate-500 uppercase">
				Cari Pertanyaan / Video
			</label>
			<div class="relative mt-1">
				<span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
					<Icon name="search" class="h-4 w-4" />
				</span>
				<input
					id="bank-search"
					type="search"
					bind:value={searchQuery}
					placeholder="Ketik kata kunci pertanyaan..."
					class="block w-full rounded-xl border border-slate-300 py-2 pr-3 pl-9 text-sm focus:border-emerald-600 focus:outline-none"
				/>
			</div>
		</div>

		<div>
			<label for="bank-video" class="block text-[11px] font-bold text-slate-500 uppercase">
				Filter Webinar
			</label>
			<select
				id="bank-video"
				bind:value={filterVideoId}
				class="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
			>
				<option value="0">Semua Video</option>
				{#each videos as v (v.id)}
					<option value={String(v.id)}>{v.title}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="bank-status" class="block text-[11px] font-bold text-slate-500 uppercase">
				Status
			</label>
			<select
				id="bank-status"
				bind:value={filterStatus}
				class="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
			>
				<option value="all">Semua Status</option>
				<option value="published">Published</option>
				<option value="draft">Draft</option>
			</select>
		</div>
	</div>

	<!-- Recorded Quizzes Table -->
	<div class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
		<div class="overflow-x-auto">
			<table class="w-full border-collapse text-left text-sm">
				<thead>
					<tr
						class="border-b border-slate-200 bg-slate-50/80 text-xs font-bold tracking-wider text-slate-500 uppercase"
					>
						<th class="w-14 px-5 py-3.5 text-center">#</th>
						<th class="px-5 py-3.5">Nama Video</th>
						<th class="px-5 py-3.5">Pertanyaan</th>
						<th class="px-5 py-3.5 whitespace-nowrap">Tipe Pertanyaan</th>
						<th class="px-5 py-3.5">Status</th>
						<th class="px-5 py-3.5 text-right whitespace-nowrap">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#if loading}
						<tr>
							<td colspan="6" class="px-5 py-10 text-center text-sm text-slate-400">
								Memuat daftar bank soal...
							</td>
						</tr>
					{:else if filteredEntries.length === 0}
						<tr>
							<td colspan="6" class="px-5 py-12 text-center text-sm text-slate-500">
								{entries.length === 0
									? 'Belum ada soal kuis yang tercatat.'
									: 'Tidak ada soal kuis yang sesuai dengan filter.'}
							</td>
						</tr>
					{:else}
						{#each filteredEntries as q, idx (q.id)}
							<tr class="align-top transition hover:bg-slate-50/60">
								<td class="px-5 py-4 text-center font-mono text-xs font-bold text-slate-500 tabular-nums">
									{idx + 1}
								</td>
								<td class="max-w-[200px] px-5 py-4">
									<div class="truncate font-semibold text-slate-800" title={q.video_title}>
										{q.video_title}
									</div>
								</td>
								<td class="min-w-[260px] max-w-md px-5 py-4">
									<p
										class="leading-relaxed break-words text-slate-900"
										title={Array.from(q.question).length > 250 ? q.question : undefined}
									>
										{truncateQuestion(q.question, 250)}
									</p>
								</td>
								<td class="px-5 py-4 whitespace-nowrap">
									<span
										class="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700"
									>
										{q.kind === 'true_false' ? 'Benar / Salah' : 'Pilihan Ganda'}
									</span>
								</td>
								<td class="px-5 py-4 whitespace-nowrap">
									{#if q.is_published}
										<span
											class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20"
										>
											<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
											PUBLISHED
										</span>
									{:else}
										<span
											class="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600"
										>
											DRAFT
										</span>
									{/if}
								</td>
								<td class="px-5 py-4 text-right whitespace-nowrap">
									<div class="inline-flex items-center justify-end gap-2">
										{#if !q.is_published}
											<button
												type="button"
												disabled={publishingId === q.id}
												onclick={() => handlePublish(q)}
												class="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
											>
												{publishingId === q.id ? 'Menerbitkan...' : 'Terbitkan'}
											</button>
										{/if}
										<a
											href="/admin/quizzes/{q.id}/answers"
											class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
										>
											<span>Cek Jawaban ({q.answers_count})</span>
										</a>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

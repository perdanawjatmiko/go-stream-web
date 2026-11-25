<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { apiFetch, formatDateTime } from '#lib/api.js';
	import { toast } from '#lib/toast.svelte.js';
	import type { QuizAnswerEntry } from '#lib/types.js';

	let loading = $state(true);
	let question = $state('');
	let options = $state<string[]>([]);
	let correctIndex = $state(0);
	let entries = $state<QuizAnswerEntry[]>([]);

	let correctTotal = $derived(entries.filter((e) => e.correct).length);

	onMount(async () => {
		try {
			const res = await apiFetch<{
				question: string;
				options: string[];
				correct_index: number;
				entries: QuizAnswerEntry[];
			}>(`/api/admin/quizzes/${page.params.id}/answers`);
			question = res.question;
			options = res.options;
			correctIndex = res.correct_index;
			entries = res.entries;
		} catch {
			toast.error('Gagal memuat hasil jawaban kuis.');
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Hasil Jawaban Kuis | KDKMP Admin</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<a
			href="/admin/quizzes"
			class="text-xs font-bold text-emerald-700 hover:underline"
		>
			← Kembali ke Studio Kuis Langsung
		</a>
		<h1 class="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
			{loading ? 'Memuat Kuis...' : question}
		</h1>
		{#if !loading && options.length > 0}
			<p class="mt-1 text-xs text-slate-500">
				Kunci jawaban benar: <strong class="text-emerald-700">{options[correctIndex]}</strong> • Total
				responden: <strong>{entries.length}</strong> ({correctTotal} menjawab benar)
			</p>
		{/if}
	</div>

	<div class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
		<div class="overflow-x-auto">
			<table class="w-full border-collapse text-left text-sm">
				<thead>
					<tr class="border-b border-slate-200 bg-slate-50/80 text-xs font-bold tracking-wider text-slate-500 uppercase">
						<th class="px-5 py-3.5">Nama Peserta</th>
						<th class="px-5 py-3.5">Email</th>
						<th class="px-5 py-3.5">Pilihan Jawaban</th>
						<th class="px-5 py-3.5">Hasil</th>
						<th class="px-5 py-3.5">Waktu Menjawab</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#if loading}
						<tr>
							<td colspan="5" class="px-5 py-10 text-center text-sm text-slate-400">
								Memuat jawaban peserta...
							</td>
						</tr>
					{:else if entries.length === 0}
						<tr>
							<td colspan="5" class="px-5 py-12 text-center text-sm text-slate-500">
								Belum ada peserta yang mengirim jawaban untuk kuis ini.
							</td>
						</tr>
					{:else}
						{#each entries as e, idx (idx)}
							<tr class="hover:bg-slate-50/60">
								<td class="px-5 py-3.5 font-semibold text-slate-900">{e.name}</td>
								<td class="px-5 py-3.5 text-slate-600">{e.email}</td>
								<td class="px-5 py-3.5 text-slate-800">{e.answer_text || `#${e.answer_index + 1}`}</td>
								<td class="px-5 py-3.5">
									{#if e.correct}
										<span class="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
											Benar
										</span>
									{:else}
										<span class="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700">
											Salah
										</span>
									{/if}
								</td>
								<td class="px-5 py-3.5 text-xs whitespace-nowrap text-slate-500">
									{formatDateTime(e.answered_at)}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

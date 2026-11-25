<script lang="ts">
	import { onMount } from 'svelte';
	import { ApiError, apiFetch } from '#lib/api.js';
	import Icon from '#lib/components/Icon.svelte';
	import { toast } from '#lib/toast.svelte.js';
	import type { AdminQuizEntry, Video } from '#lib/types.js';

	let loading = $state(true);
	let totalQuizzes = $state(0);
	let videos = $state<Video[]>([]);

	// Quiz Builder State
	let selectedVideoId = $state<number>(0);
	let kind = $state<'multiple_choice' | 'true_false'>('multiple_choice');
	let question = $state('');
	let correctAnswer = $state('');
	let wrong1 = $state('');
	let wrong2 = $state('');
	let wrong3 = $state('');
	let tfCorrect = $state<'Benar' | 'Salah'>('Benar');
	let creating = $state(false);

	async function loadMetadata() {
		loading = true;
		try {
			const res = await apiFetch<{
				entries: AdminQuizEntry[];
				videos: Video[];
			}>('/api/admin/quizzes');
			totalQuizzes = res.entries.length;
			videos = res.videos;
			if (selectedVideoId === 0 && res.videos.length > 0) {
				const active = res.videos.find((v) => v.is_active);
				selectedVideoId = active ? active.id : res.videos[0].id;
			}
		} catch {
			toast.error('Gagal memuat data webinar kuis.');
		} finally {
			loading = false;
		}
	}

	onMount(loadMetadata);

	async function handleCreateQuiz(event: SubmitEvent) {
		event.preventDefault();
		if (creating) return;
		creating = true;

		try {
			await apiFetch('/api/admin/quizzes', {
				method: 'POST',
				body: {
					video_id: Number(selectedVideoId),
					kind,
					question: question.trim(),
					correct_answer: kind === 'true_false' ? tfCorrect : correctAnswer.trim(),
					wrong_answers:
						kind === 'multiple_choice' ? [wrong1.trim(), wrong2.trim(), wrong3.trim()] : []
				}
			});
			question = '';
			correctAnswer = '';
			wrong1 = '';
			wrong2 = '';
			wrong3 = '';
			totalQuizzes += 1;
			toast.success('Soal kuis berhasil disimpan ke Daftar Bank Soal.');
		} catch (err) {
			toast.error(err instanceof ApiError ? err.message : 'Gagal membuat soal kuis.');
		} finally {
			creating = false;
		}
	}
</script>

<svelte:head>
	<title>Studio Kuis Langsung | KDKMP Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-slate-900">Studio Kuis Langsung</h1>
			<p class="mt-1 text-sm text-slate-500">
				Buat soal kuis baru untuk narasumber, lalu kelola penerbitan dan jawabannya di halaman
				<strong>Daftar Bank Soal</strong>.
			</p>
		</div>

		<a
			href="/admin/quizzes/bank"
			class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 sm:text-sm"
		>
			<Icon name="list" class="h-4 w-4" />
			<span>Daftar Bank Soal ({totalQuizzes})</span>
		</a>
	</div>

	<!-- Create Quiz Card -->
	<section class="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
		<h2 class="text-base font-bold text-slate-900">Buat Soal Baru</h2>

		{#if videos.length === 0 && !loading}
			<p class="mt-3 text-sm text-slate-500">
				Tambahkan minimal satu video di menu
				<a href="/admin/videos" class="font-bold text-emerald-700 underline">Manajemen Video</a>
				terlebih dahulu.
			</p>
		{:else}
			<form class="mt-4 space-y-4" onsubmit={handleCreateQuiz}>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label for="quiz-video" class="block text-xs font-bold text-slate-700 uppercase">
							Target Webinar
						</label>
						<select
							id="quiz-video"
							bind:value={selectedVideoId}
							class="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/20 focus:outline-none"
						>
							{#each videos as v (v.id)}
								<option value={v.id}>
									{v.title} {v.is_active ? '(LIVE AKTIF)' : ''}
								</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="quiz-kind" class="block text-xs font-bold text-slate-700 uppercase">
							Tipe Pertanyaan
						</label>
						<select
							id="quiz-kind"
							bind:value={kind}
							class="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/20 focus:outline-none"
						>
							<option value="multiple_choice">Pilihan Ganda (4 Opsi Diacak Otomatis)</option>
							<option value="true_false">Benar / Salah</option>
						</select>
					</div>
				</div>

				<div>
					<label for="quiz-question" class="block text-xs font-bold text-slate-700 uppercase">
						Teks Pertanyaan
					</label>
					<textarea
						id="quiz-question"
						rows="3"
						required
						maxlength="500"
						bind:value={question}
						placeholder="Tuliskan pertanyaan kuis dari narasumber..."
						class="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/20 focus:outline-none"
					></textarea>
				</div>

				{#if kind === 'multiple_choice'}
					<div class="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
						<div>
							<label for="ans-correct" class="block text-xs font-bold text-emerald-800 uppercase">
								✓ Jawaban Benar
							</label>
							<input
								id="ans-correct"
								type="text"
								required
								maxlength="200"
								bind:value={correctAnswer}
								placeholder="Masukkan pilihan jawaban yang benar"
								class="mt-1 block w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-sm focus:border-emerald-600 focus:outline-none"
							/>
						</div>

						<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
							<div>
								<label for="ans-w1" class="block text-xs font-semibold text-slate-600">
									Pengecoh 1
								</label>
								<input
									id="ans-w1"
									type="text"
									required
									maxlength="200"
									bind:value={wrong1}
									class="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
								/>
							</div>
							<div>
								<label for="ans-w2" class="block text-xs font-semibold text-slate-600">
									Pengecoh 2
								</label>
								<input
									id="ans-w2"
									type="text"
									required
									maxlength="200"
									bind:value={wrong2}
									class="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
								/>
							</div>
							<div>
								<label for="ans-w3" class="block text-xs font-semibold text-slate-600">
									Pengecoh 3
								</label>
								<input
									id="ans-w3"
									type="text"
									required
									maxlength="200"
									bind:value={wrong3}
									class="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
								/>
							</div>
						</div>
					</div>
				{:else}
					<div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
						<span class="block text-xs font-bold text-slate-700 uppercase">Pilih Kunci Jawaban</span>
						<div class="mt-2 flex gap-4">
							<label
								class="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-800"
							>
								<input
									type="radio"
									name="tf"
									value="Benar"
									bind:group={tfCorrect}
									class="h-4 w-4 accent-emerald-700"
								/>
								<span>Benar</span>
							</label>
							<label
								class="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-800"
							>
								<input
									type="radio"
									name="tf"
									value="Salah"
									bind:group={tfCorrect}
									class="h-4 w-4 accent-emerald-700"
								/>
								<span>Salah</span>
							</label>
						</div>
					</div>
				{/if}

				<div class="flex justify-end">
					<button
						type="submit"
						disabled={creating}
						class="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800 disabled:opacity-60 sm:text-sm"
					>
						<Icon name="plus" class="h-4 w-4" />
						<span>{creating ? 'Menyimpan...' : 'Simpan Draft Kuis'}</span>
					</button>
				</div>
			</form>
		{/if}
	</section>
</div>

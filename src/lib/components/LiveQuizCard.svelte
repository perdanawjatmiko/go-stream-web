<script lang="ts">
	import { ApiError, apiFetch } from '#lib/api.js';
	import { toast } from '#lib/toast.svelte.js';
	import type { LiveQuiz } from '#lib/types.js';
	import Icon from './Icon.svelte';

	let {
		quizzes = [],
		quizIndex = $bindable(0),
		selections = $bindable<Record<number, number>>({}),
		onRefreshQuizzes,
		onOpenModal
	}: {
		quizzes: LiveQuiz[];
		quizIndex?: number;
		selections?: Record<number, number>;
		onRefreshQuizzes: () => Promise<void>;
		onOpenModal?: (index: number) => void;
	} = $props();

	let submittingQuiz = $state(false);

	let unansweredCount = $derived(quizzes.filter((q) => !q.answered).length);
	let safeQuizIndex = $derived(Math.min(quizIndex, Math.max(0, quizzes.length - 1)));
	let currentQuiz = $derived(quizzes[safeQuizIndex]);

	async function handleQuizSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!currentQuiz || currentQuiz.answered || submittingQuiz) return;
		const selected = selections[currentQuiz.id];
		if (selected === undefined) return;

		submittingQuiz = true;
		try {
			await apiFetch<{ correct: boolean }>(`/api/video/quizzes/${currentQuiz.id}/answer`, {
				method: 'POST',
				body: { answer_index: selected }
			});
			await onRefreshQuizzes();
			toast.success('Jawaban kuis berhasil dikirim.');
		} catch (err) {
			toast.error(err instanceof ApiError ? err.message : 'Gagal mengirim jawaban kuis.');
		} finally {
			submittingQuiz = false;
		}
	}
</script>

<section
	class="overflow-hidden rounded-2xl border bg-white shadow-sm transition {unansweredCount > 0
		? 'border-emerald-400 ring-2 ring-emerald-500/15'
		: 'border-slate-200/90'}"
>
	<!-- Prominent Card Header -->
	<div
		class="flex items-center justify-between border-b px-5 py-3.5 {unansweredCount > 0
			? 'border-emerald-100 bg-emerald-50/70'
			: 'border-slate-100 bg-slate-50/80'}"
	>
		<div class="flex items-center gap-2.5">
			<div
				class="flex h-8 w-8 items-center justify-center rounded-lg {unansweredCount > 0
					? 'bg-emerald-600 text-white'
					: 'bg-slate-200/80 text-slate-600'}"
			>
				<Icon name="quiz" class="h-4 w-4" />
			</div>
			<div>
				<h2 class="text-sm font-bold text-slate-900">Kuis Narasumber</h2>
				<p class="text-[11px] text-slate-500">Interaksi langsung selama sesi live</p>
			</div>
		</div>

		{#if unansweredCount > 0}
			<span
				class="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs tabular-nums"
			>
				<span class="h-1.5 w-1.5 animate-ping rounded-full bg-white"></span>
				{unansweredCount} Belum Dijawab
			</span>
		{:else if quizzes.length > 0}
			<span
				class="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-600/20 tabular-nums"
			>
				{quizzes.length} Selesai
			</span>
		{/if}
	</div>

	<div class="p-5">
		{#if !currentQuiz}
			<div class="py-5 text-center">
				<div
					class="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400"
				>
					<Icon name="quiz" class="h-5 w-5" />
				</div>
				<h3 class="text-sm font-bold text-slate-800">Belum Ada Kuis Aktif</h3>
				<p class="mt-1 text-xs leading-relaxed text-slate-500">
					Saat narasumber menerbitkan soal kuis, popup kuis akan otomatis muncul di layar Anda.
				</p>
			</div>
		{:else}
			<div class="flex flex-wrap items-center justify-between gap-2">
				<div class="flex items-center gap-2">
					<span
						class="rounded-full bg-emerald-700 px-2.5 py-0.5 text-[11px] font-bold text-white tabular-nums"
					>
						Soal {safeQuizIndex + 1} / {quizzes.length}
					</span>
					<span
						class="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800"
					>
						{currentQuiz.kind === 'true_false' ? 'Benar / Salah' : 'Pilihan Ganda'}
					</span>
				</div>

				{#if onOpenModal && !currentQuiz.answered}
					<button
						type="button"
						onclick={() => onOpenModal(safeQuizIndex)}
						class="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
					>
						Perbesar Popup
					</button>
				{/if}
			</div>

			<form class="mt-3.5" onsubmit={handleQuizSubmit}>
				<h3 class="text-sm leading-relaxed font-bold text-slate-900">
					{currentQuiz.question}
				</h3>

				<div class="mt-3 space-y-2">
					{#each currentQuiz.options as option, idx (idx)}
						{@const isChecked = currentQuiz.answered
							? currentQuiz.answer_index === idx
							: selections[currentQuiz.id] === idx}
						<label
							class="flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition {isChecked
								? 'border-emerald-600 bg-emerald-50/80 font-semibold text-emerald-950'
								: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'} {currentQuiz.answered
								? 'cursor-default'
								: ''}"
						>
							<input
								type="radio"
								name="card-quiz-{currentQuiz.id}"
								value={idx}
								disabled={currentQuiz.answered}
								checked={isChecked}
								onchange={() => (selections[currentQuiz.id] = idx)}
								class="h-4 w-4 shrink-0 accent-emerald-700"
							/>
							<span class="leading-snug">{option}</span>
						</label>
					{/each}
				</div>

				{#if currentQuiz.answered}
					<div
						class="mt-3.5 rounded-xl border px-3.5 py-2.5 text-xs font-bold {currentQuiz.correct
							? 'border-emerald-200 bg-emerald-50 text-emerald-800'
							: 'border-slate-200 bg-slate-50 text-slate-700'}"
					>
						{currentQuiz.correct
							? '✓ Jawaban Anda benar.'
							: 'Jawaban Anda telah tersimpan.'}
					</div>
				{/if}

				<div class="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
					<div class="flex items-center gap-1.5">
						<button
							type="button"
							disabled={safeQuizIndex === 0}
							onclick={() => (quizIndex = Math.max(0, safeQuizIndex - 1))}
							class="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
							aria-label="Soal sebelumnya"
						>
							←
						</button>
						<button
							type="button"
							disabled={safeQuizIndex >= quizzes.length - 1}
							onclick={() => (quizIndex = Math.min(quizzes.length - 1, safeQuizIndex + 1))}
							class="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
							aria-label="Soal berikutnya"
						>
							→
						</button>
					</div>

					<button
						type="submit"
						disabled={currentQuiz.answered ||
							selections[currentQuiz.id] === undefined ||
							submittingQuiz}
						class="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
					>
						{currentQuiz.answered
							? 'Terkirim'
							: submittingQuiz
								? 'Mengirim...'
								: 'Kirim Jawaban'}
					</button>
				</div>
			</form>
		{/if}
	</div>
</section>

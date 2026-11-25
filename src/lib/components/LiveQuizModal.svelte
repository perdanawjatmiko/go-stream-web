<script lang="ts">
	import { ApiError, apiFetch } from '#lib/api.js';
	import { toast } from '#lib/toast.svelte.js';
	import type { LiveQuiz } from '#lib/types.js';
	import Icon from './Icon.svelte';

	let {
		quiz,
		quizNumber,
		totalQuizzes,
		selections = $bindable<Record<number, number>>({}),
		onClose,
		onRefreshQuizzes
	}: {
		quiz: LiveQuiz;
		quizNumber: number;
		totalQuizzes: number;
		selections: Record<number, number>;
		onClose: () => void;
		onRefreshQuizzes: () => Promise<void>;
	} = $props();

	let submitting = $state(false);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (quiz.answered || submitting) return;
		const selected = selections[quiz.id];
		if (selected === undefined) return;

		submitting = true;
		try {
			const res = await apiFetch<{ correct: boolean }>(`/api/video/quizzes/${quiz.id}/answer`, {
				method: 'POST',
				body: { answer_index: selected }
			});
			await onRefreshQuizzes();
			toast.success(
				res.correct ? 'Jawaban kuis Anda benar!' : 'Jawaban kuis Anda berhasil disimpan.'
			);
			onClose();
		} catch (err) {
			toast.error(err instanceof ApiError ? err.message : 'Gagal mengirim jawaban kuis.');
		} finally {
			submitting = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
	role="dialog"
	aria-modal="true"
	aria-labelledby="live-quiz-popup-title"
>
	<div
		class="w-full max-w-lg overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-2xl"
	>
		<!-- Highlight Banner -->
		<div class="flex items-center justify-between bg-emerald-700 px-5 py-3.5 text-white">
			<div class="flex items-center gap-2.5">
				<span class="relative flex h-2.5 w-2.5">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-80"
					></span>
					<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-white"></span>
				</span>
				<span id="live-quiz-popup-title" class="text-sm font-extrabold tracking-wide uppercase">
					Kuis Baru dari Narasumber!
				</span>
			</div>

			<button
				type="button"
				onclick={onClose}
				class="rounded-lg p-1 text-emerald-100 transition hover:bg-emerald-600 hover:text-white"
				aria-label="Tutup popup kuis"
			>
				<Icon name="close" class="h-5 w-5" />
			</button>
		</div>

		<form class="p-6" onsubmit={handleSubmit}>
			<div class="flex flex-wrap items-center gap-2">
				<span
					class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 tabular-nums"
				>
					Soal {quizNumber} dari {totalQuizzes}
				</span>
				<span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
					{quiz.kind === 'true_false' ? 'Benar / Salah' : 'Pilihan Ganda'}
				</span>
			</div>

			<h3 class="mt-4 text-base leading-relaxed font-bold text-slate-900 sm:text-lg">
				{quiz.question}
			</h3>

			<div class="mt-4 space-y-2.5">
				{#each quiz.options as option, idx (idx)}
					{@const isChecked = quiz.answered
						? quiz.answer_index === idx
						: selections[quiz.id] === idx}
					<label
						class="flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm transition {isChecked
							? 'border-emerald-600 bg-emerald-50/90 font-semibold text-emerald-950 ring-1 ring-emerald-600/30'
							: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}"
					>
						<input
							type="radio"
							name="modal-quiz-{quiz.id}"
							value={idx}
							disabled={quiz.answered}
							checked={isChecked}
							onchange={() => (selections[quiz.id] = idx)}
							class="h-4 w-4 shrink-0 accent-emerald-700"
						/>
						<span class="leading-snug">{option}</span>
					</label>
				{/each}
			</div>

			<div
				class="mt-6 flex flex-col-reverse justify-between gap-2.5 border-t border-slate-100 pt-4 sm:flex-row sm:items-center"
			>
				<button
					type="button"
					onclick={onClose}
					class="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
				>
					Nanti (Lihat di Card Kuis)
				</button>

				<button
					type="submit"
					disabled={quiz.answered || selections[quiz.id] === undefined || submitting}
					class="rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 sm:text-sm"
				>
					{submitting ? 'Mengirim Jawaban...' : 'Kirim Jawaban Sekarang'}
				</button>
			</div>
		</form>
	</div>
</div>

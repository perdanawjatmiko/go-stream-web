<script lang="ts">
	import { ApiError, apiFetch, formatDateTime } from '#lib/api.js';
	import { toast } from '#lib/toast.svelte.js';
	import type { LiveQuiz, Question } from '#lib/types.js';
	import Icon from './Icon.svelte';

	let {
		questions = $bindable([]),
		canAsk = $bindable(true),
		quizzes = [],
		activeTab = $bindable<'questions' | 'quizzes'>('questions'),
		onRefreshQuizzes
	}: {
		questions: Question[];
		canAsk: boolean;
		quizzes: LiveQuiz[];
		activeTab?: 'questions' | 'quizzes';
		onRefreshQuizzes: () => Promise<void>;
	} = $props();

	let questionInput = $state('');
	let submittingQuestion = $state(false);
	let charCount = $derived(Array.from(questionInput).length);

	let quizIndex = $state(0);
	let selections = $state<Record<number, number>>({});
	let submittingQuiz = $state(false);

	let unansweredCount = $derived(quizzes.filter((q) => !q.answered).length);
	let safeQuizIndex = $derived(Math.min(quizIndex, Math.max(0, quizzes.length - 1)));
	let currentQuiz = $derived(quizzes[safeQuizIndex]);

	async function handleQuestionSubmit(event: SubmitEvent) {
		event.preventDefault();
		const trimmed = questionInput.trim();
		if (!trimmed || submittingQuestion) return;

		submittingQuestion = true;
		try {
			const res = await apiFetch<{
				message: string;
				questions: Question[];
				can_ask: boolean;
			}>('/api/video/questions', {
				method: 'POST',
				body: { question: trimmed }
			});
			questions = res.questions;
			canAsk = res.can_ask;
			questionInput = '';
			toast.success(res.message || 'Pertanyaan berhasil dikirim.');
		} catch (err) {
			toast.error(err instanceof ApiError ? err.message : 'Gagal mengirim pertanyaan.');
		} finally {
			submittingQuestion = false;
		}
	}

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

<aside
	class="flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm lg:sticky lg:top-20"
>
	<!-- Tab Switcher -->
	<div class="grid grid-cols-2 border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1">
		<button
			type="button"
			onclick={() => (activeTab = 'questions')}
			class="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition sm:text-sm {activeTab ===
			'questions'
				? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200/80'
				: 'text-slate-600 hover:text-slate-900'}"
		>
			<Icon name="question" class="h-4 w-4" />
			<span>Tanya Jawab</span>
			<span
				class="rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-700 tabular-nums"
			>
				{questions.length}/2
			</span>
		</button>

		<button
			type="button"
			onclick={() => (activeTab = 'quizzes')}
			class="relative flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition sm:text-sm {activeTab ===
			'quizzes'
				? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200/80'
				: 'text-slate-600 hover:text-slate-900'}"
		>
			<Icon name="quiz" class="h-4 w-4" />
			<span>Kuis Live</span>
			{#if unansweredCount > 0}
				<span
					class="flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white tabular-nums"
				>
					<span class="h-1.5 w-1.5 animate-ping rounded-full bg-white"></span>
					{unansweredCount}
				</span>
			{:else if quizzes.length > 0}
				<span
					class="rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-700 tabular-nums"
				>
					{quizzes.length}
				</span>
			{/if}
		</button>
	</div>

	{#if activeTab === 'questions'}
		<div class="flex flex-col gap-5 p-5">
			<div>
				<h2 class="text-base font-bold text-slate-900">Pertanyaan Anda</h2>
				<p class="mt-1 text-xs leading-relaxed text-slate-500">
					Maksimal 2 pertanyaan untuk sesi webinar ini (maks. 300 karakter per pertanyaan).
				</p>

				{#if canAsk}
					<form class="mt-3.5 space-y-2.5" onsubmit={handleQuestionSubmit}>
						<textarea
							rows="3"
							maxlength="300"
							required
							bind:value={questionInput}
							placeholder="Tuliskan pertanyaan Anda untuk narasumber..."
							class="block w-full resize-none rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/20 focus:outline-none"
						></textarea>
						<div class="flex items-center justify-between">
							<span class="text-xs font-medium text-slate-400 tabular-nums">
								{charCount} / 300
							</span>
							<button
								type="submit"
								disabled={submittingQuestion || charCount === 0}
								class="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-55"
							>
								{submittingQuestion ? 'Mengirim...' : 'Kirim Pertanyaan'}
							</button>
						</div>
					</form>
				{:else}
					<div
						class="mt-3.5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800"
					>
						<Icon name="check" class="h-4 w-4 shrink-0 text-emerald-600" />
						<span>Anda telah menggunakan seluruh kuota (2 pertanyaan) pada webinar ini.</span>
					</div>
				{/if}
			</div>

			<div class="border-t border-slate-100 pt-4">
				<h3 class="text-xs font-bold tracking-wider text-slate-400 uppercase">
					Riwayat Pertanyaan Terkirim
				</h3>
				{#if questions.length === 0}
					<p class="mt-3 rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">
						Belum ada pertanyaan yang Anda kirim.
					</p>
				{:else}
					<ol class="mt-3 space-y-2.5">
						{#each questions as q (q.id)}
							<li class="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
								<div class="flex items-center justify-between text-xs">
									<span class="font-bold text-emerald-800">Pertanyaan #{q.number}</span>
									<span class="text-slate-400">{formatDateTime(q.created_at)}</span>
								</div>
								<p class="mt-1.5 text-sm whitespace-pre-wrap break-words text-slate-700">
									{q.text}
								</p>
							</li>
						{/each}
					</ol>
				{/if}
			</div>
		</div>
	{:else}
		<div class="p-5">
			{#if !currentQuiz}
				<div class="py-8 text-center">
					<div
						class="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400"
					>
						<Icon name="quiz" class="h-5 w-5" />
					</div>
					<h2 class="text-sm font-bold text-slate-800">Belum Ada Kuis Aktif</h2>
					<p class="mt-1 text-xs leading-relaxed text-slate-500">
						Soal dari narasumber akan muncul otomatis secara real-time di panel ini saat diterbitkan.
					</p>
				</div>
			{:else}
				<div class="flex flex-wrap items-center justify-between gap-2">
					<span
						class="rounded-full bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white tabular-nums"
					>
						Soal {safeQuizIndex + 1} dari {quizzes.length}
					</span>
					<span
						class="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800"
					>
						{currentQuiz.kind === 'true_false' ? 'Benar / Salah' : 'Pilihan Ganda'}
					</span>
				</div>

				<form class="mt-4" onsubmit={handleQuizSubmit}>
					<h3 class="text-sm leading-relaxed font-bold text-slate-900 sm:text-base">
						{currentQuiz.question}
					</h3>

					<div class="mt-3.5 space-y-2">
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
									name="quiz-{currentQuiz.id}"
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

					<div
						class="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-4"
					>
						<div class="flex items-center gap-1.5">
							<button
								type="button"
								disabled={safeQuizIndex === 0}
								onclick={() => (quizIndex = Math.max(0, safeQuizIndex - 1))}
								class="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
							>
								←
							</button>
							<button
								type="button"
								disabled={safeQuizIndex >= quizzes.length - 1}
								onclick={() => (quizIndex = Math.min(quizzes.length - 1, safeQuizIndex + 1))}
								class="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
	{/if}
</aside>

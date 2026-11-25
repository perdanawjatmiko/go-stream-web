<script lang="ts">
	import { ApiError, apiFetch, formatDateTime } from '#lib/api.js';
	import { toast } from '#lib/toast.svelte.js';
	import type { Question } from '#lib/types.js';
	import Icon from './Icon.svelte';

	let {
		questions = $bindable([]),
		canAsk = $bindable(true)
	}: {
		questions: Question[];
		canAsk: boolean;
	} = $props();

	let questionInput = $state('');
	let submittingQuestion = $state(false);
	let charCount = $derived(Array.from(questionInput).length);

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
</script>

<section class="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
	<div class="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
		<div class="flex items-center gap-2.5">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200/80 text-slate-700">
				<Icon name="question" class="h-4 w-4" />
			</div>
			<div>
				<h2 class="text-sm font-bold text-slate-900">Tanya Jawab</h2>
				<p class="text-[11px] text-slate-500">Kirim pertanyaan ke narasumber</p>
			</div>
		</div>

		<span
			class="rounded-full bg-slate-200/80 px-2.5 py-1 text-[11px] font-bold text-slate-700 tabular-nums"
		>
			Kuota {questions.length}/2
		</span>
	</div>

	<div class="flex flex-col gap-5 p-5">
		<div>
			<p class="text-xs leading-relaxed text-slate-500">
				Maksimal 2 pertanyaan untuk sesi webinar ini (maks. 300 karakter per pertanyaan).
			</p>

			{#if canAsk}
				<form class="mt-3 space-y-2.5" onsubmit={handleQuestionSubmit}>
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
					class="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800"
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
</section>

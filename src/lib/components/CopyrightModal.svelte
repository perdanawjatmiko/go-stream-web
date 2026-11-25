<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';

	let {
		seconds = 10,
		onAcknowledge
	}: {
		seconds?: number;
		onAcknowledge: () => void;
	} = $props();

	let totalSeconds = $derived(seconds > 0 ? seconds : 10);
	let remaining = $state(10);
	let ready = $state(false);

	onMount(() => {
		remaining = totalSeconds;
		const timer = window.setInterval(() => {
			remaining -= 1;
			if (remaining <= 0) {
				window.clearInterval(timer);
				remaining = 0;
				ready = true;
				onAcknowledge();
			}
		}, 1000);

		return () => window.clearInterval(timer);
	});

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && !ready) {
			event.preventDefault();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
	role="dialog"
	aria-modal="true"
	aria-labelledby="copyright-modal-title"
>
	<div
		class="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
	>
		<div class="h-1.5 w-full bg-slate-100">
			<div
				class="h-full bg-red-600 transition-all duration-1000 ease-linear"
				style="width: {Math.max(0, (remaining / totalSeconds) * 100)}%"
			></div>
		</div>

		<div class="p-6 sm:p-7">
			<div class="flex items-start gap-3.5">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700"
				>
					<Icon name="alert" class="h-5 w-5" />
				</div>
				<div>
					<h2 id="copyright-modal-title" class="text-lg font-bold text-red-800">
						Perhatian Pelanggaran Hak Cipta
					</h2>
					<p class="mt-2 text-sm leading-relaxed text-slate-600">
						Mohon untuk tidak menyebarkan link ataupun merekam tayangan yang berkaitan dengan acara
						ini demi menjaga kenyamanan dan ketertiban selama acara berlangsung. Terima kasih.
					</p>
				</div>
			</div>

			<div class="mt-6 flex justify-end">
				<button
					type="button"
					disabled={!ready}
					onclick={onAcknowledge}
					class="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
				>
					{ready ? 'Saya Mengerti' : `Saya Mengerti (${remaining})`}
				</button>
			</div>
		</div>
	</div>
</div>

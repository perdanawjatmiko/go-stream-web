<script lang="ts">
	import { dismissToast, toastState } from '#lib/toast.svelte.js';
	import Icon from './Icon.svelte';
</script>

{#if toastState.items.length > 0}
	<div
		class="pointer-events-none fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
		aria-live="polite"
	>
		{#each toastState.items as item (item.id)}
			<div
				class="pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all {item.kind ===
				'error'
					? 'border-red-200 bg-red-50/95 text-red-900'
					: item.kind === 'success'
						? 'border-emerald-200 bg-emerald-50/95 text-emerald-950'
						: 'border-slate-200 bg-white/95 text-slate-800'}"
				role="status"
			>
				<span
					class="mt-0.5 shrink-0 {item.kind === 'error'
						? 'text-red-600'
						: item.kind === 'success'
							? 'text-emerald-600'
							: 'text-slate-500'}"
				>
					<Icon name={item.kind === 'success' ? 'check' : 'alert'} class="h-4 w-4" />
				</span>
				<p class="flex-1 text-sm font-medium leading-snug">{item.message}</p>
				<button
					type="button"
					onclick={() => dismissToast(item.id)}
					class="shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100"
					aria-label="Tutup notifikasi"
				>
					<Icon name="close" class="h-4 w-4" />
				</button>
			</div>
		{/each}
	</div>
{/if}

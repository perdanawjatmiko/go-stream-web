<script lang="ts">
	export type IconName =
		| 'play'
		| 'pause'
		| 'rewind'
		| 'forward'
		| 'volume'
		| 'mute'
		| 'fullscreen'
		| 'exit-fullscreen'
		| 'eye'
		| 'eye-off'
		| 'shield'
		| 'video'
		| 'users'
		| 'quiz'
		| 'question'
		| 'attendance'
		| 'dashboard'
		| 'download'
		| 'plus'
		| 'edit'
		| 'check'
		| 'alert'
		| 'logout'
		| 'menu'
		| 'close'
		| 'search';

	let {
		name,
		class: className = 'w-5 h-5'
	}: {
		name: IconName;
		class?: string;
	} = $props();
</script>

<svg
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
	aria-hidden="true"
>
	{#if name === 'play'}
		<polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none" />
	{:else if name === 'pause'}
		<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
		<rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
	{:else if name === 'rewind'}
		<path d="M11 19l-9-7 9-7v14z" />
		<path d="M22 19l-9-7 9-7v14z" />
	{:else if name === 'forward'}
		<path d="M13 19l9-7-9-7v14z" />
		<path d="M2 19l9-7-9-7v14z" />
	{:else if name === 'volume'}
		<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
		<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
		<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
	{:else if name === 'mute'}
		<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
		<line x1="23" y1="9" x2="17" y2="15" />
		<line x1="17" y1="9" x2="23" y2="15" />
	{:else if name === 'fullscreen'}
		<path d="M8 3H5a2 2 0 0 0-2 2v3" />
		<path d="M21 8V5a2 2 0 0 0-2-2h-3" />
		<path d="M3 16v3a2 2 0 0 0 2 2h3" />
		<path d="M16 21h3a2 2 0 0 0 2-2v-3" />
	{:else if name === 'exit-fullscreen'}
		<path d="M8 3v3a2 2 0 0 1-2 2H3" />
		<path d="M21 8h-3a2 2 0 0 1-2-2V3" />
		<path d="M3 16h3a2 2 0 0 1 2 2v3" />
		<path d="M16 21v-3a2 2 0 0 1 2-2h3" />
	{:else if name === 'eye'}
		<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
		<circle cx="12" cy="12" r="3" />
	{:else if name === 'eye-off'}
		<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
		<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
		<path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
		<line x1="2" y1="2" x2="22" y2="22" />
	{:else if name === 'shield'}
		<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
		<path d="m9 12 2 2 4-4" />
	{:else if name === 'video'}
		<rect x="2" y="5" width="14" height="14" rx="2" />
		<polygon points="22 7 16 12 22 17 22 7" />
	{:else if name === 'users'}
		<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
		<circle cx="9" cy="7" r="4" />
		<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
		<path d="M16 3.13a4 4 0 0 1 0 7.75" />
	{:else if name === 'quiz'}
		<path d="M9 11l3 3L22 4" />
		<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
	{:else if name === 'question'}
		<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
	{:else if name === 'attendance'}
		<rect x="3" y="4" width="18" height="18" rx="2" />
		<line x1="16" y1="2" x2="16" y2="6" />
		<line x1="8" y1="2" x2="8" y2="6" />
		<line x1="3" y1="10" x2="21" y2="10" />
		<path d="m9 16 2 2 4-4" />
	{:else if name === 'dashboard'}
		<rect x="3" y="3" width="7" height="9" rx="1" />
		<rect x="14" y="3" width="7" height="5" rx="1" />
		<rect x="14" y="12" width="7" height="9" rx="1" />
		<rect x="3" y="16" width="7" height="5" rx="1" />
	{:else if name === 'download'}
		<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
		<polyline points="7 10 12 15 17 10" />
		<line x1="12" y1="15" x2="12" y2="3" />
	{:else if name === 'plus'}
		<line x1="12" y1="5" x2="12" y2="19" />
		<line x1="5" y1="12" x2="19" y2="12" />
	{:else if name === 'edit'}
		<path d="M12 20h9" />
		<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
	{:else if name === 'check'}
		<polyline points="20 6 9 17 4 12" />
	{:else if name === 'alert'}
		<circle cx="12" cy="12" r="10" />
		<line x1="12" y1="8" x2="12" y2="12" />
		<line x1="12" y1="16" x2="12.01" y2="16" />
	{:else if name === 'logout'}
		<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
		<polyline points="16 17 21 12 16 7" />
		<line x1="21" y1="12" x2="9" y2="12" />
	{:else if name === 'menu'}
		<line x1="3" y1="6" x2="21" y2="6" />
		<line x1="3" y1="12" x2="21" y2="12" />
		<line x1="3" y1="18" x2="21" y2="18" />
	{:else if name === 'close'}
		<line x1="18" y1="6" x2="6" y2="18" />
		<line x1="6" y1="6" x2="18" y2="18" />
	{:else if name === 'search'}
		<circle cx="11" cy="11" r="8" />
		<line x1="21" y1="21" x2="16.65" y2="16.65" />
	{/if}
</svg>

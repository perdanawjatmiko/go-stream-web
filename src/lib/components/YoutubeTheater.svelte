<script lang="ts">
	import { onMount } from 'svelte';
	import { apiFetch, formatDuration, sendWatchBeacon } from '#lib/api.js';
	import type { User, Video } from '#lib/types.js';
	import Icon from './Icon.svelte';

	interface YTPlayer {
		playVideo(): void;
		pauseVideo(): void;
		seekTo(seconds: number, allowSeekAhead: boolean): void;
		mute(): void;
		unMute(): void;
		isMuted(): boolean;
		setVolume(volume: number): void;
		getDuration(): number;
		getCurrentTime(): number;
		getPlayerState(): number;
		destroy(): void;
	}

	interface YTNamespace {
		Player: new (
			el: HTMLElement,
			opts: {
				width: string;
				height: string;
				videoId: string;
				playerVars: Record<string, unknown>;
				events: {
					onReady?: (ev: { target: YTPlayer }) => void;
					onStateChange?: (ev: { data: number }) => void;
				};
			}
		) => YTPlayer;
		PlayerState: {
			PLAYING: number;
		};
	}

	let {
		video,
		user,
		initialWatched = 0
	}: {
		video: Video;
		user: User;
		initialWatched?: number;
	} = $props();

	let shellEl: HTMLDivElement | undefined = $state();
	let mountEl: HTMLDivElement | undefined = $state();

	let player: YTPlayer | null = null;
	let isPlaying = $state(false);
	let isMuted = $state(true);
	let volume = $state(100);
	let currentTime = $state(0);
	let duration = $state(0);
	let isFullscreen = $state(false);

	let watchedBase = $state(0);
	let pendingWatch = $state(0);
	let watchBusy = false;
	let lastTick = 0;

	$effect(() => {
		watchedBase = initialWatched;
	});

	let progressPermille = $derived(duration > 0 ? Math.round((currentTime / duration) * 1000) : 0);
	let totalWatchedDisplay = $derived(formatDuration(watchedBase + pendingWatch));

	async function flushWatch() {
		if (watchBusy || pendingWatch < 1) return;
		watchBusy = true;
		const delta = Math.min(10, pendingWatch);
		try {
			const res = await apiFetch<{ watched_seconds: number }>('/api/video/watch', {
				method: 'POST',
				body: { video_id: video.id, seconds: delta }
			});
			watchedBase = res.watched_seconds;
			pendingWatch = Math.max(0, pendingWatch - delta);
		} catch {
			// Will retry on next heartbeat
		} finally {
			watchBusy = false;
		}
	}

	function loadYouTubeAPI(): Promise<YTNamespace> {
		const win = window as unknown as {
			YT?: YTNamespace;
			onYouTubeIframeAPIReady?: () => void;
		};
		if (win.YT && typeof win.YT.Player === 'function') {
			return Promise.resolve(win.YT);
		}
		return new Promise((resolve) => {
			const prev = win.onYouTubeIframeAPIReady;
			win.onYouTubeIframeAPIReady = () => {
				if (prev) prev();
				resolve(win.YT!);
			};
			if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
				const script = document.createElement('script');
				script.src = 'https://www.youtube.com/iframe_api';
				document.head.appendChild(script);
			}
		});
	}

	function syncControls() {
		if (!player || typeof player.getDuration !== 'function') return;
		duration = player.getDuration() || 0;
		currentTime = player.getCurrentTime() || 0;
		isMuted = player.isMuted();
	}

	onMount(() => {
		let destroyed = false;
		lastTick = performance.now();

		loadYouTubeAPI().then((YT) => {
			if (destroyed || !mountEl) return;
			const target = document.createElement('div');
			mountEl.replaceChildren(target);

			player = new YT.Player(target, {
				width: '100%',
				height: '100%',
				videoId: video.youtube_video_id,
				playerVars: {
					autoplay: 1,
					mute: 1,
					controls: 0,
					disablekb: 1,
					fs: 0,
					playsinline: 1,
					rel: 0,
					origin: window.location.origin
				},
				events: {
					onReady: (ev) => {
						ev.target.mute();
						ev.target.playVideo();
						syncControls();
					},
					onStateChange: (ev) => {
						const playing = ev.data === YT.PlayerState.PLAYING;
						isPlaying = playing;
						if (!playing) {
							flushWatch();
						}
						syncControls();
					}
				}
			});
		});

		const controlInterval = window.setInterval(syncControls, 500);
		const watchInterval = window.setInterval(() => {
			const now = performance.now();
			const elapsed = now - lastTick;
			lastTick = now;
			if (elapsed > 1500 || document.hidden || !isPlaying) return;
			pendingWatch += 1;
			if (pendingWatch >= 5) {
				flushWatch();
			}
		}, 1000);

		const onFullscreenChange = () => {
			isFullscreen = Boolean(document.fullscreenElement);
		};
		const onPageHide = () => {
			if (pendingWatch > 0) {
				sendWatchBeacon(video.id, pendingWatch);
			}
		};

		document.addEventListener('fullscreenchange', onFullscreenChange);
		window.addEventListener('pagehide', onPageHide);

		return () => {
			destroyed = true;
			window.clearInterval(controlInterval);
			window.clearInterval(watchInterval);
			document.removeEventListener('fullscreenchange', onFullscreenChange);
			window.removeEventListener('pagehide', onPageHide);
			if (pendingWatch > 0) {
				sendWatchBeacon(video.id, pendingWatch);
			}
			if (player && typeof player.destroy === 'function') {
				player.destroy();
				player = null;
			}
		};
	});

	function togglePlay() {
		if (!player) return;
		if (isPlaying) player.pauseVideo();
		else player.playVideo();
	}

	function seekBy(delta: number) {
		if (!player) return;
		const next = Math.min(duration || 0, Math.max(0, (player.getCurrentTime() || 0) + delta));
		player.seekTo(next, true);
		currentTime = next;
	}

	function handleSeekInput(event: Event) {
		if (!player || duration <= 0) return;
		const val = Number((event.currentTarget as HTMLInputElement).value);
		const target = (val / 1000) * duration;
		player.seekTo(target, true);
		currentTime = target;
	}

	function toggleMute() {
		if (!player) return;
		if (player.isMuted()) {
			player.unMute();
			player.setVolume(volume > 0 ? volume : 100);
			if (volume === 0) volume = 100;
			isMuted = false;
		} else {
			player.mute();
			isMuted = true;
		}
	}

	function handleVolumeInput(event: Event) {
		if (!player) return;
		const val = Number((event.currentTarget as HTMLInputElement).value);
		volume = val;
		player.setVolume(val);
		if (val > 0) {
			player.unMute();
			isMuted = false;
		} else {
			player.mute();
			isMuted = true;
		}
	}

	async function toggleFullscreen() {
		if (!shellEl) return;
		if (document.fullscreenElement) {
			await document.exitFullscreen();
		} else {
			await shellEl.requestFullscreen();
		}
	}
</script>

<!-- Keep all application-owned elements strictly outside the YouTube viewport for compliance -->
<div
	bind:this={shellEl}
	class="theater-shell overflow-hidden rounded-2xl bg-slate-950 shadow-xl ring-1 ring-slate-900/10"
>
	<!-- Top Status Bar (Outside Video Viewport) -->
	<div
		class="flex items-center justify-between border-b border-slate-800/90 bg-slate-900/95 px-4 py-2.5 text-xs text-slate-200"
	>
		<div class="flex items-center gap-2 font-semibold tracking-wide">
			<span class="relative flex h-2.5 w-2.5">
				<span
					class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
				></span>
				<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
			</span>
			<span class="text-emerald-400 uppercase">Live Stream</span>
		</div>

		<div class="rounded-md bg-slate-800/90 px-2.5 py-1 font-medium text-slate-300 tabular-nums">
			Waktu menonton: <strong class="text-white">{totalWatchedDisplay}</strong>
		</div>
	</div>

	<!-- Pure 16:9 YouTube IFrame Viewport -->
	<div bind:this={mountEl} class="theater-viewport relative aspect-video w-full bg-black"></div>

	<!-- Custom Control Bar (Outside Video Viewport) -->
	<div
		class="flex items-center gap-2 border-t border-slate-800 bg-slate-950 px-3 py-2.5 text-white sm:gap-3 sm:px-4"
		aria-label="Kontrol video"
	>
		<button
			type="button"
			onclick={togglePlay}
			class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-slate-900 transition hover:border-emerald-500 hover:bg-emerald-600"
			aria-label={isPlaying ? 'Pause' : 'Play'}
			title={isPlaying ? 'Pause' : 'Play'}
		>
			<Icon name={isPlaying ? 'pause' : 'play'} class="h-4 w-4" />
		</button>

		<button
			type="button"
			onclick={() => seekBy(-10)}
			class="hidden h-9 items-center gap-1 rounded-lg border border-white/15 bg-slate-900 px-2.5 text-xs font-semibold transition hover:border-emerald-500 hover:bg-emerald-600 sm:flex"
			title="Mundur 10 detik"
		>
			−10s
		</button>

		<button
			type="button"
			onclick={() => seekBy(10)}
			class="hidden h-9 items-center gap-1 rounded-lg border border-white/15 bg-slate-900 px-2.5 text-xs font-semibold transition hover:border-emerald-500 hover:bg-emerald-600 sm:flex"
			title="Maju 10 detik"
		>
			+10s
		</button>

		<span class="min-w-[3.1rem] text-center text-xs text-slate-300 tabular-nums">
			{formatDuration(currentTime)}
		</span>

		<input
			type="range"
			min="0"
			max="1000"
			value={progressPermille}
			oninput={handleSeekInput}
			aria-label="Posisi video"
			class="theater-range min-w-16 flex-1"
		/>

		<span class="hidden min-w-[3.1rem] text-center text-xs text-slate-400 tabular-nums sm:inline">
			{formatDuration(duration)}
		</span>

		{#if isMuted}
			<button
				type="button"
				onclick={toggleMute}
				class="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500"
			>
				<Icon name="mute" class="h-4 w-4" />
				<span>Aktifkan Suara</span>
			</button>
		{:else}
			<button
				type="button"
				onclick={toggleMute}
				class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-slate-900 transition hover:border-emerald-500 hover:bg-emerald-600"
				aria-label="Mute"
				title="Mute"
			>
				<Icon name="volume" class="h-4 w-4" />
			</button>
		{/if}

		<input
			type="range"
			min="0"
			max="100"
			value={isMuted ? 0 : volume}
			oninput={handleVolumeInput}
			aria-label="Volume"
			class="theater-range hidden w-20 md:block"
		/>

		<button
			type="button"
			onclick={toggleFullscreen}
			class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-slate-900 transition hover:border-emerald-500 hover:bg-emerald-600"
			aria-label={isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'}
			title={isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'}
		>
			<Icon name={isFullscreen ? 'exit-fullscreen' : 'fullscreen'} class="h-4 w-4" />
		</button>
	</div>

	<!-- Attribution & Viewer Watermark Bar (Outside Video Viewport) -->
	<div
		class="flex flex-col justify-between gap-1 border-t border-slate-800/80 bg-slate-900 px-4 py-2 text-xs text-slate-400 sm:flex-row sm:items-center"
		aria-label="Informasi hak cipta dan pengguna"
	>
		<div class="flex items-center gap-1.5 font-semibold text-slate-200">
			<Icon name="shield" class="h-3.5 w-3.5 text-emerald-400" />
			<span>Copyright PT. Agrinas Pangan Nusantara</span>
		</div>
		<div class="truncate text-slate-400">
			<span>{user.name}</span>
			<span class="mx-1.5 text-slate-600">•</span>
			<span>{user.email}</span>
		</div>
	</div>
</div>

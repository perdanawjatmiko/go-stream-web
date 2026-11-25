<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ApiError, apiFetch, setCsrfToken } from '#lib/api.js';
	import CopyrightModal from '#lib/components/CopyrightModal.svelte';
	import EngagementPanel from '#lib/components/EngagementPanel.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import YoutubeTheater from '#lib/components/YoutubeTheater.svelte';
	import { toast } from '#lib/toast.svelte.js';
	import type { LiveQuiz, Question, User, Video, VideoStateResponse } from '#lib/types.js';

	let loading = $state(true);
	let user = $state<User | null>(null);
	let available = $state(false);
	let activeVideo = $state<Video | null>(null);
	let questions = $state<Question[]>([]);
	let canAsk = $state(false);
	let watchedSeconds = $state(0);
	let noticeSeconds = $state(10);
	let acknowledged = $state(false);

	let quizzes = $state<LiveQuiz[]>([]);
	let activeTab = $state<'questions' | 'quizzes'>('questions');
	let shortcutNotice = $state(false);
	let shortcutTimer: number | undefined;

	function triggerShortcutNotice() {
		shortcutNotice = true;
		window.clearTimeout(shortcutTimer);
		shortcutTimer = window.setTimeout(() => {
			shortcutNotice = false;
		}, 1800);
	}

	function handleKeydown(event: KeyboardEvent) {
		const key = event.key.toLowerCase();
		const code = event.code.toLowerCase();
		const inspectKey =
			['i', 'j', 'c', 'k'].includes(key) || ['keyi', 'keyj', 'keyc', 'keyk'].includes(code);
		const blocked =
			event.key === 'F12' ||
			(event.ctrlKey && event.shiftKey && inspectKey) ||
			(event.metaKey && event.altKey && inspectKey) ||
			(event.metaKey && event.shiftKey && key === 'c') ||
			((event.ctrlKey || event.metaKey) && key === 'u');

		if (!blocked) return;
		event.preventDefault();
		event.stopPropagation();
		triggerShortcutNotice();
	}

	async function loadVideoState() {
		try {
			const data = await apiFetch<VideoStateResponse>('/api/video');
			setCsrfToken(data.csrf_token);
			user = data.user;
			available = data.available;
			activeVideo = data.active_video;
			questions = data.questions;
			canAsk = data.can_ask;
			watchedSeconds = data.watched_seconds;
			noticeSeconds = data.video_notice_seconds;
		} catch (err) {
			if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
				await goto('/login', { replaceState: true });
				return;
			}
			toast.error('Gagal memuat data webinar.');
		}
	}

	async function loadQuizzes(notifyNew = false) {
		try {
			const prevIds = new Set(quizzes.map((q) => q.id));
			const items = await apiFetch<LiveQuiz[]>('/api/video/quizzes');
			quizzes = items;
			const hasBrandNew = items.some((q) => !prevIds.has(q.id) && !q.answered);
			if (hasBrandNew) {
				activeTab = 'quizzes';
				if (notifyNew) {
					toast.info('Kuis baru dari narasumber telah tersedia!');
				}
			}
		} catch {
			// Ignore transient quiz fetch failure
		}
	}

	onMount(() => {
		let eventSource: EventSource | null = null;

		(async () => {
			await loadVideoState();
			if (available) {
				await loadQuizzes(false);
			}
			loading = false;

			// Connect real-time SSE stream for instant quiz & active-video updates
			eventSource = new EventSource('/api/video/quizzes/stream', { withCredentials: true });
			eventSource.addEventListener('quiz_update', () => {
				loadQuizzes(true);
			});
			eventSource.addEventListener('video_update', async () => {
				await loadVideoState();
				if (available) {
					await loadQuizzes(false);
				}
			});
		})();

		return () => {
			window.clearTimeout(shortcutTimer);
			if (eventSource) {
				eventSource.close();
			}
		};
	});

	async function handleLogout() {
		try {
			await apiFetch('/api/auth/logout', { method: 'POST', body: {} });
		} finally {
			await goto('/login', { replaceState: true });
		}
	}
</script>

<svelte:head>
	<title>{activeVideo ? `${activeVideo.title} | KDKMP` : 'Ruang Webinar | KDKMP'}</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="min-h-screen bg-slate-50"
	oncontextmenu={(e) => {
		e.preventDefault();
		triggerShortcutNotice();
	}}
>
	<!-- Top Navigation -->
	<header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
		<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
			<a href="/video" class="flex items-center gap-2.5 text-decoration-none">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white">
					<Icon name="video" class="h-4 w-4" />
				</div>
				<span class="text-sm font-extrabold tracking-widest text-emerald-800">KDKMP</span>
			</a>

			{#if user}
				<div class="flex items-center gap-3 sm:gap-4">
					<div class="hidden text-right sm:block">
						<div class="text-xs font-bold text-slate-800">{user.name}</div>
						<div class="text-[11px] text-slate-500">{user.email}</div>
					</div>
					<button
						type="button"
						onclick={handleLogout}
						class="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
					>
						<Icon name="logout" class="h-3.5 w-3.5" />
						<span>Logout</span>
					</button>
				</div>
			{/if}
		</div>
	</header>

	{#if loading}
		<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center">
			<div class="flex items-center gap-3 text-sm font-medium text-slate-500">
				<span
					class="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"
				></span>
				Menyiapkan ruang webinar...
			</div>
		</div>
	{:else if !available || !activeVideo}
		<main class="mx-auto max-w-lg px-4 py-20 text-center">
			<div
				class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
			>
				<div
					class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"
				>
					<Icon name="video" class="h-7 w-7" />
				</div>
				<h1 class="text-xl font-bold text-slate-900">Video Belum Tersedia</h1>
				<p class="mt-2 text-sm leading-relaxed text-slate-600">
					Belum ada sesi webinar aktif saat ini. Halaman ini akan otomatis diperbarui begitu
					administrator mengaktifkan tayangan webinar.
				</p>
			</div>
		</main>
	{:else}
		{#if !acknowledged}
			<CopyrightModal
				seconds={noticeSeconds}
				onAcknowledge={() => {
					acknowledged = true;
				}}
			/>
		{/if}

		<main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
			<div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
				<!-- Left Stage: Video Theater + Webinar Info -->
				<div class="space-y-4 lg:col-span-8">
					{#if acknowledged && user}
						{#key activeVideo.id}
							<YoutubeTheater
								video={activeVideo}
								{user}
								initialWatched={watchedSeconds}
							/>
						{/key}
						<p class="text-xs text-slate-500">
							Video diputar otomatis tanpa suara sesuai kebijakan browser. Klik tombol
							<strong class="text-slate-700">Aktifkan Suara</strong> pada kontrol player untuk menyalakan
							audio.
						</p>
					{:else}
						<div
							class="flex aspect-video w-full items-center justify-center rounded-2xl bg-slate-900 text-sm text-slate-400"
						>
							Menunggu konfirmasi pemberitahuan hak cipta...
						</div>
					{/if}

					<div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
						<h1 class="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
							{activeVideo.title}
						</h1>
						{#if activeVideo.description}
							<p class="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-slate-600">
								{activeVideo.description}
							</p>
						{/if}
					</div>
				</div>

				<!-- Right Panel: Split-View Interactive Engagement -->
				<div class="lg:col-span-4">
					<EngagementPanel
						bind:questions
						bind:canAsk
						{quizzes}
						bind:activeTab
						onRefreshQuizzes={() => loadQuizzes(false)}
					/>
				</div>
			</div>
		</main>
	{/if}

	{#if shortcutNotice}
		<div
			class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl"
			role="status"
		>
			Akses menu tersebut dinonaktifkan pada halaman ini.
		</div>
	{/if}
</div>

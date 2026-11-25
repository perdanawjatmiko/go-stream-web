<script lang="ts">
	import { onMount } from 'svelte';
	import { ApiError, apiFetch, formatDateTime } from '#lib/api.js';
	import Icon from '#lib/components/Icon.svelte';
	import { toast } from '#lib/toast.svelte.js';
	import type { Video } from '#lib/types.js';

	let loading = $state(true);
	let videos = $state<Video[]>([]);

	// Form Modal State
	let showFormModal = $state(false);
	let editingVideo = $state<Video | null>(null);
	let title = $state('');
	let youtubeInput = $state('');
	let description = $state('');
	let activateImmediately = $state(false);
	let saving = $state(false);
	let formError = $state('');

	// Confirm Status Dialog State
	let confirmTarget = $state<{ video: Video; activate: boolean } | null>(null);
	let toggling = $state(false);

	async function loadVideos() {
		loading = true;
		try {
			const res = await apiFetch<{ videos: Video[] }>('/api/admin/videos');
			videos = res.videos;
		} catch {
			toast.error('Gagal memuat daftar video.');
		} finally {
			loading = false;
		}
	}

	onMount(loadVideos);

	function openCreateModal() {
		editingVideo = null;
		title = '';
		youtubeInput = '';
		description = '';
		activateImmediately = false;
		formError = '';
		showFormModal = true;
	}

	function openEditModal(v: Video) {
		editingVideo = v;
		title = v.title;
		youtubeInput = v.youtube_video_id;
		description = v.description;
		activateImmediately = v.is_active;
		formError = '';
		showFormModal = true;
	}

	async function handleSaveVideo(event: SubmitEvent) {
		event.preventDefault();
		if (saving) return;
		saving = true;
		formError = '';

		try {
			if (editingVideo) {
				await apiFetch(`/api/admin/videos/${editingVideo.id}`, {
					method: 'PUT',
					body: {
						title: title.trim(),
						youtube_video: youtubeInput.trim(),
						description: description.trim()
					}
				});
				toast.success('Data video berhasil diperbarui.');
			} else {
				await apiFetch('/api/admin/videos', {
					method: 'POST',
					body: {
						title: title.trim(),
						youtube_video: youtubeInput.trim(),
						description: description.trim(),
						is_active: activateImmediately
					}
				});
				toast.success('Video baru berhasil ditambahkan.');
			}
			showFormModal = false;
			await loadVideos();
		} catch (err) {
			formError = err instanceof ApiError ? err.message : 'Gagal menyimpan data video.';
		} finally {
			saving = false;
		}
	}

	async function handleConfirmToggle() {
		if (!confirmTarget || toggling) return;
		toggling = true;
		const { video, activate } = confirmTarget;
		try {
			await apiFetch(`/api/admin/videos/${video.id}/${activate ? 'activate' : 'deactivate'}`, {
				method: 'POST',
				body: {}
			});
			toast.success(
				activate
					? `Webinar "${video.title}" kini aktif ditayangkan.`
					: `Tayangan "${video.title}" telah dinonaktifkan.`
			);
			confirmTarget = null;
			await loadVideos();
		} catch (err) {
			toast.error(err instanceof ApiError ? err.message : 'Gagal mengubah status video.');
		} finally {
			toggling = false;
		}
	}
</script>

<svelte:head>
	<title>Manajemen Video | KDKMP Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-slate-900">Manajemen Video</h1>
			<p class="mt-1 text-sm text-slate-500">
				Kelola katalog YouTube webinar dan pilih satu video aktif untuk peserta.
			</p>
		</div>
		<button
			type="button"
			onclick={openCreateModal}
			class="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800 sm:text-sm"
		>
			<Icon name="plus" class="h-4 w-4" />
			<span>Tambah Video</span>
		</button>
	</div>

	<div class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
		<div class="overflow-x-auto">
			<table class="w-full border-collapse text-left text-sm">
				<thead>
					<tr class="border-b border-slate-200 bg-slate-50/80 text-xs font-bold tracking-wider text-slate-500 uppercase">
						<th class="px-5 py-3.5">Judul Webinar</th>
						<th class="px-5 py-3.5">YouTube ID</th>
						<th class="px-5 py-3.5">Status</th>
						<th class="px-5 py-3.5">Diperbarui</th>
						<th class="px-5 py-3.5 text-right">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#if loading}
						<tr>
							<td colspan="5" class="px-5 py-10 text-center text-sm text-slate-400">
								Memuat katalog video...
							</td>
						</tr>
					{:else if videos.length === 0}
						<tr>
							<td colspan="5" class="px-5 py-12 text-center text-sm text-slate-500">
								Belum ada video terdaftar. Klik <strong>Tambah Video</strong> untuk memulai.
							</td>
						</tr>
					{:else}
						{#each videos as v (v.id)}
							<tr class="transition hover:bg-slate-50/60">
								<td class="max-w-xs px-5 py-4">
									<div class="font-bold text-slate-900">{v.title}</div>
									{#if v.description}
										<div class="mt-0.5 line-clamp-1 text-xs text-slate-500">{v.description}</div>
									{/if}
								</td>
								<td class="px-5 py-4">
									<code class="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
										{v.youtube_video_id}
									</code>
								</td>
								<td class="px-5 py-4">
									{#if v.is_active}
										<span
											class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20"
										>
											<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
											ACTIVE
										</span>
									{:else}
										<span
											class="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
										>
											INACTIVE
										</span>
									{/if}
								</td>
								<td class="px-5 py-4 text-xs whitespace-nowrap text-slate-500">
									{formatDateTime(v.updated_at)}
								</td>
								<td class="px-5 py-4 text-right whitespace-nowrap">
									<div class="inline-flex items-center gap-2">
										<button
											type="button"
											onclick={() => openEditModal(v)}
											class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
										>
											Edit
										</button>
										{#if v.is_active}
											<button
												type="button"
												onclick={() => (confirmTarget = { video: v, activate: false })}
												class="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"
											>
												Nonaktifkan
											</button>
										{:else}
											<button
												type="button"
												onclick={() => (confirmTarget = { video: v, activate: true })}
												class="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
											>
												Aktifkan
											</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Create / Edit Video Modal -->
{#if showFormModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
	>
		<div class="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-bold text-slate-900">
					{editingVideo ? 'Edit Video Webinar' : 'Tambah Video Webinar'}
				</h2>
				<button
					type="button"
					onclick={() => (showFormModal = false)}
					class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
				>
					<Icon name="close" class="h-5 w-5" />
				</button>
			</div>

			{#if formError}
				<div class="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">
					{formError}
				</div>
			{/if}

			<form class="mt-4 space-y-4" onsubmit={handleSaveVideo}>
				<div>
					<label for="vid-title" class="block text-xs font-bold text-slate-700 uppercase">
						Judul Webinar
					</label>
					<input
						id="vid-title"
						type="text"
						required
						maxlength="255"
						bind:value={title}
						placeholder="Contoh: Sosialisasi Program KDKMP Tahap 1"
						class="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/20 focus:outline-none"
					/>
				</div>

				<div>
					<label for="vid-yt" class="block text-xs font-bold text-slate-700 uppercase">
						URL atau ID Video YouTube
					</label>
					<input
						id="vid-yt"
						type="text"
						required
						bind:value={youtubeInput}
						placeholder="https://youtu.be/xxxx atau ID 11 karakter"
						class="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/20 focus:outline-none"
					/>
				</div>

				<div>
					<label for="vid-desc" class="block text-xs font-bold text-slate-700 uppercase">
						Deskripsi (Opsional)
					</label>
					<textarea
						id="vid-desc"
						rows="3"
						bind:value={description}
						placeholder="Ringkasan materi atau jadwal webinar..."
						class="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/20 focus:outline-none"
					></textarea>
				</div>

				{#if !editingVideo}
					<label class="flex cursor-pointer items-center gap-2.5 rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-700">
						<input
							type="checkbox"
							bind:checked={activateImmediately}
							class="h-4 w-4 rounded accent-emerald-700"
						/>
						<span>Langsung aktifkan sebagai tayangan webinar utama</span>
					</label>
				{/if}

				<div class="flex justify-end gap-2.5 pt-2">
					<button
						type="button"
						onclick={() => (showFormModal = false)}
						class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={saving}
						class="rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
					>
						{saving ? 'Menyimpan...' : 'Simpan Video'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Confirm Activate / Deactivate Modal -->
{#if confirmTarget}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
	>
		<div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
			<h2 class="text-lg font-bold text-slate-900">
				{confirmTarget.activate ? 'Aktifkan Tayangan Webinar?' : 'Nonaktifkan Tayangan Webinar?'}
			</h2>
			<p class="mt-1 text-sm font-semibold text-emerald-800">“{confirmTarget.video.title}”</p>
			<p class="mt-2 text-sm leading-relaxed text-slate-600">
				{confirmTarget.activate
					? 'Mengaktifkan video ini akan otomatis menonaktifkan video lain yang sedang aktif dan langsung memperbarui layar seluruh peserta.'
					: 'Peserta tidak akan melihat tayangan video sampai Anda mengaktifkan salah satu video kembali.'}
			</p>
			<div class="mt-6 flex justify-end gap-2.5">
				<button
					type="button"
					onclick={() => (confirmTarget = null)}
					class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
				>
					Batal
				</button>
				<button
					type="button"
					disabled={toggling}
					onclick={handleConfirmToggle}
					class="rounded-xl px-5 py-2 text-xs font-bold text-white disabled:opacity-60 {confirmTarget.activate
						? 'bg-emerald-700 hover:bg-emerald-800'
						: 'bg-red-600 hover:bg-red-700'}"
				>
					{toggling
						? 'Memproses...'
						: confirmTarget.activate
							? 'Ya, Aktifkan'
							: 'Ya, Nonaktifkan'}
				</button>
			</div>
		</div>
	</div>
{/if}

<script lang="ts">
	import { onMount } from 'svelte';
	import { ApiError, apiFetch, formatDateTime } from '#lib/api.js';
	import Icon from '#lib/components/Icon.svelte';
	import { toast } from '#lib/toast.svelte.js';
	import type { Pagination, User } from '#lib/types.js';

	let loading = $state(true);
	let users = $state<User[]>([]);
	let searchQuery = $state('');
	let pagination = $state<Pagination>({
		page: 1,
		pages: 1,
		total: 0,
		limit: 25,
		prev: 0,
		next: 2,
		has_prev: false,
		has_next: false
	});

	// Modal state
	let showModal = $state(false);
	let editingUser = $state<User | null>(null);
	let name = $state('');
	let email = $state('');
	let phoneNumber = $state('');
	let isActive = $state(true);
	let saving = $state(false);
	let formError = $state('');

	async function loadUsers(page = 1) {
		loading = true;
		try {
			const params = new URLSearchParams({ page: String(page) });
			if (searchQuery.trim()) params.set('q', searchQuery.trim());
			const res = await apiFetch<{
				users: User[];
				pagination: Pagination;
			}>(`/api/admin/users?${params.toString()}`);
			users = res.users;
			pagination = res.pagination;
		} catch {
			toast.error('Gagal memuat daftar peserta.');
		} finally {
			loading = false;
		}
	}

	onMount(() => loadUsers(1));

	function handleSearch(event: SubmitEvent) {
		event.preventDefault();
		loadUsers(1);
	}

	function openCreateModal() {
		editingUser = null;
		name = '';
		email = '';
		phoneNumber = '';
		isActive = true;
		formError = '';
		showModal = true;
	}

	function openEditModal(u: User) {
		editingUser = u;
		name = u.name;
		email = u.email;
		phoneNumber = u.phone_number;
		isActive = u.is_active;
		formError = '';
		showModal = true;
	}

	async function handleSaveUser(event: SubmitEvent) {
		event.preventDefault();
		if (saving) return;
		saving = true;
		formError = '';

		try {
			const body = {
				name: name.trim(),
				email: email.trim(),
				phone_number: phoneNumber.trim(),
				is_active: isActive
			};
			if (editingUser) {
				await apiFetch(`/api/admin/users/${editingUser.id}`, {
					method: 'PUT',
					body
				});
				toast.success('Data peserta berhasil diperbarui.');
			} else {
				await apiFetch('/api/admin/users', {
					method: 'POST',
					body
				});
				toast.success('Peserta baru berhasil ditambahkan.');
			}
			showModal = false;
			await loadUsers(pagination.page);
		} catch (err) {
			formError = err instanceof ApiError ? err.message : 'Gagal menyimpan peserta.';
		} finally {
			saving = false;
		}
	}

	async function toggleUserActive(u: User) {
		const nextState = !u.is_active;
		try {
			await apiFetch(`/api/admin/users/${u.id}/${nextState ? 'activate' : 'deactivate'}`, {
				method: 'POST',
				body: {}
			});
			toast.success(
				nextState
					? `Akun ${u.name} diaktifkan.`
					: `Akun ${u.name} dinonaktifkan dan sesinya dicabut.`
			);
			await loadUsers(pagination.page);
		} catch (err) {
			toast.error(err instanceof ApiError ? err.message : 'Gagal mengubah status peserta.');
		}
	}
</script>

<svelte:head>
	<title>Data Peserta | KDKMP Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-slate-900">Manajemen Peserta</h1>
			<p class="mt-1 text-sm text-slate-500">
				Total {pagination.total.toLocaleString('id-ID')} peserta terdaftar. Nonaktifkan akun untuk mencabut
				akses dan sesi aktifnya.
			</p>
		</div>
		<button
			type="button"
			onclick={openCreateModal}
			class="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800 sm:text-sm"
		>
			<Icon name="plus" class="h-4 w-4" />
			<span>Tambah Peserta</span>
		</button>
	</div>

	<!-- Search Bar -->
	<form
		onsubmit={handleSearch}
		class="flex flex-col gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row"
	>
		<div class="relative flex-1">
			<span class="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
				<Icon name="search" class="h-4 w-4" />
			</span>
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Cari nama, email, atau nomor HP peserta..."
				class="block w-full rounded-xl border border-slate-300 py-2 pr-3.5 pl-10 text-sm focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/20 focus:outline-none"
			/>
		</div>
		<button
			type="submit"
			class="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white transition hover:bg-slate-800 sm:text-sm"
		>
			Cari
		</button>
		{#if searchQuery}
			<button
				type="button"
				onclick={() => {
					searchQuery = '';
					loadUsers(1);
				}}
				class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
			>
				Reset
			</button>
		{/if}
	</form>

	<!-- Users Table -->
	<div class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
		<div class="overflow-x-auto">
			<table class="w-full border-collapse text-left text-sm">
				<thead>
					<tr class="border-b border-slate-200 bg-slate-50/80 text-xs font-bold tracking-wider text-slate-500 uppercase">
						<th class="px-5 py-3.5">Nama Peserta</th>
						<th class="px-5 py-3.5">Email</th>
						<th class="px-5 py-3.5">Nomor HP</th>
						<th class="px-5 py-3.5">Status</th>
						<th class="px-5 py-3.5">Terdaftar</th>
						<th class="px-5 py-3.5 text-right">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#if loading}
						<tr>
							<td colspan="6" class="px-5 py-10 text-center text-sm text-slate-400">
								Memuat data peserta...
							</td>
						</tr>
					{:else if users.length === 0}
						<tr>
							<td colspan="6" class="px-5 py-12 text-center text-sm text-slate-500">
								Tidak ada data peserta yang cocok.
							</td>
						</tr>
					{:else}
						{#each users as u (u.id)}
							<tr class="transition hover:bg-slate-50/60">
								<td class="px-5 py-3.5 font-semibold text-slate-900">{u.name}</td>
								<td class="px-5 py-3.5 text-slate-600">{u.email}</td>
								<td class="px-5 py-3.5 font-mono text-xs text-slate-600">
									{u.phone_number || '—'}
								</td>
								<td class="px-5 py-3.5">
									{#if u.is_active}
										<span class="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
											Aktif
										</span>
									{:else}
										<span class="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
											Nonaktif
										</span>
									{/if}
								</td>
								<td class="px-5 py-3.5 text-xs whitespace-nowrap text-slate-500">
									{formatDateTime(u.created_at)}
								</td>
								<td class="px-5 py-3.5 text-right whitespace-nowrap">
									<div class="inline-flex items-center gap-2">
										<button
											type="button"
											onclick={() => openEditModal(u)}
											class="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
										>
											Edit
										</button>
										<button
											type="button"
											onclick={() => toggleUserActive(u)}
											class="rounded-lg px-2.5 py-1 text-xs font-bold {u.is_active
												? 'border border-red-200 text-red-700 hover:bg-red-50'
												: 'bg-emerald-700 text-white hover:bg-emerald-800'}"
										>
											{u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
										</button>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		{#if pagination.pages > 1}
			<div class="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 text-xs text-slate-600">
				<span>Halaman <strong>{pagination.page}</strong> dari <strong>{pagination.pages}</strong></span>
				<div class="flex gap-2">
					<button
						type="button"
						disabled={!pagination.has_prev || loading}
						onclick={() => loadUsers(pagination.prev)}
						class="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:opacity-40"
					>
						← Sebelumnya
					</button>
					<button
						type="button"
						disabled={!pagination.has_next || loading}
						onclick={() => loadUsers(pagination.next)}
						class="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:opacity-40"
					>
						Berikutnya →
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Create / Edit User Modal -->
{#if showModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
	>
		<div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-bold text-slate-900">
					{editingUser ? 'Edit Data Peserta' : 'Tambah Peserta Baru'}
				</h2>
				<button
					type="button"
					onclick={() => (showModal = false)}
					class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
				>
					<Icon name="close" class="h-5 w-5" />
				</button>
			</div>

			{#if !editingUser}
				<p class="mt-1 text-xs text-slate-500">
					Password awal peserta otomatis menggunakan konfigurasi <code>DEFAULT_USER_PASSWORD</code>.
				</p>
			{/if}

			{#if formError}
				<div class="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">
					{formError}
				</div>
			{/if}

			<form class="mt-4 space-y-4" onsubmit={handleSaveUser}>
				<div>
					<label for="usr-name" class="block text-xs font-bold text-slate-700 uppercase">
						Nama Lengkap
					</label>
					<input
						id="usr-name"
						type="text"
						required
						maxlength="200"
						bind:value={name}
						class="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/20 focus:outline-none"
					/>
				</div>

				<div>
					<label for="usr-email" class="block text-xs font-bold text-slate-700 uppercase">
						Email
					</label>
					<input
						id="usr-email"
						type="email"
						required
						maxlength="254"
						bind:value={email}
						class="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/20 focus:outline-none"
					/>
				</div>

				<div>
					<label for="usr-phone" class="block text-xs font-bold text-slate-700 uppercase">
						Nomor HP (Opsional)
					</label>
					<input
						id="usr-phone"
						type="tel"
						bind:value={phoneNumber}
						placeholder="0812xxxxxxxx"
						class="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/20 focus:outline-none"
					/>
				</div>

				<label class="flex cursor-pointer items-center gap-2.5 rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-700">
					<input
						type="checkbox"
						bind:checked={isActive}
						class="h-4 w-4 rounded accent-emerald-700"
					/>
					<span>Akun aktif (diizinkan login ke webinar)</span>
				</label>

				<div class="flex justify-end gap-2.5 pt-2">
					<button
						type="button"
						onclick={() => (showModal = false)}
						class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={saving}
						class="rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
					>
						{saving ? 'Menyimpan...' : 'Simpan Peserta'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

const destinations = new Set(['dashboard','home','profile','explore','reading-guide','learn','pronunciation','reference','quiz','detective','reviews']);

export function googleLoginError(reason:string|null):string {
  switch(reason) {
    case 'google_session': return 'Sesi Google kedaluwarsa atau cookie login tidak tersedia. Tutup jendela Google lama, lalu mulai lagi dari tombol Masuk dengan Google di browser yang sama.';
    case 'google_code': return 'Kode login Google sudah tidak berlaku. Mulai ulang dari tombol Masuk dengan Google; jangan memuat ulang halaman callback.';
    case 'google_account_exists': return 'Email Google ini sudah terdaftar. Masuk dengan email dan kata sandi Anda, lalu pilih Hubungkan Google di profil. Akun tidak ditautkan secara otomatis.';
    case 'google_link_mismatch': return 'Penautan belum berhasil. Masuk kembali dan pilih akun Google dengan email yang sama seperti akun TajwidLens Anda. Akun lama tidak diubah.';
    case 'google_configuration': return 'Konfigurasi OAuth Google belum cocok. Administrator perlu memeriksa client dan alamat callback aplikasi.';
    case 'google_unavailable': return 'Layanan login Google sementara tidak dapat dihubungi. Tunggu sebentar lalu mulai login lagi.';
    case 'google_identity': return 'Identitas Google tidak dapat diverifikasi. Mulai ulang login; jika tetap gagal, hubungi administrator.';
    case 'google_cancelled': return 'Login Google dibatalkan. Anda dapat mencoba lagi atau menggunakan email dan kata sandi.';
    default: return 'Login Google tidak berhasil. Coba lagi atau gunakan metode masuk akun Anda.';
  }
}

export function safeReturnPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\s%]/.test(value)) return '/dashboard/';
  const url = new URL(value, 'https://tajwidlens.invalid');
  return destinations.has(url.pathname.split('/')[1]) ? `${url.pathname}${url.search}${url.hash}` : '/dashboard/';
}

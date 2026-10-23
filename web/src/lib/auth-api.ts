export type Account = {id:string;email:string;nickname:string;fullName:string|null;learningGoal:string|null;level:string|null;emailVerified:boolean;loginMethods:string[]};
export const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';
export class ApiError extends Error { constructor(message:string,public status:number) {super(message);} }
export async function authApi<T>(path:string,body?:unknown,method = 'POST'):Promise<T> {
  if (!apiUrl) throw new ApiError('Layanan akun belum tersedia. Anda tetap dapat membaca dan belajar tanpa akun.',503);
  let response:Response;
  try {
    response = await fetch(`${apiUrl}/api/v1${path}`,{method:body === undefined ? 'GET' : method,credentials:'include',cache:'no-store',
      headers:body === undefined ? {} : {'Content-Type':'application/json','X-TajwidLens-CSRF':'1'},
      body:body === undefined ? undefined : JSON.stringify(body)});
  } catch { throw new ApiError('Tidak dapat terhubung. Periksa koneksi lalu coba lagi.',0); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status === 429 ? 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.' : Array.isArray(data.message) ? data.message.join(' ') : data.message || 'Permintaan gagal. Silakan coba lagi.',response.status);
  return data;
}

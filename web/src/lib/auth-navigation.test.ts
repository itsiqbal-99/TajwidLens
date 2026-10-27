import { expect, it } from 'vitest';
import { googleLoginError, safeReturnPath } from './auth-navigation';
import { parseApiUrl } from './auth-api';

it('explains safe Google failure reasons without reflecting arbitrary callback input',()=>{
  expect(googleLoginError('google_session')).toMatch(/Sesi Google kedaluwarsa/);
  expect(googleLoginError('google_code')).toMatch(/Kode login Google/);
  expect(googleLoginError('google_account_exists')).toMatch(/tidak ditautkan/);
  expect(googleLoginError('google_link_mismatch')).toMatch(/email yang sama/);
  expect(googleLoginError('google_configuration')).toMatch(/Konfigurasi OAuth/);
  expect(googleLoginError('google_unavailable')).toMatch(/tidak dapat dihubungi/);
  expect(googleLoginError('google_identity')).toMatch(/tidak dapat diverifikasi/);
  expect(googleLoginError('google_cancelled')).toMatch(/dibatalkan/);
  for(const value of [null,'google','constructor','__proto__','<script>token=secret</script>']) expect(googleLoginError(value)).toBe(googleLoginError(null));
});

it('allows only internal application return paths',()=>{
  for (const value of [null,'https://evil.test','//evil.test','/\\evil.test','/%2f%2fevil.test','/login/','/home/../../login/']) {
    expect(safeReturnPath(value)).toBe('/dashboard/');
  }
  expect(safeReturnPath('/profile/')).toBe('/profile/');
  expect(safeReturnPath('/dashboard/')).toBe('/dashboard/');
  expect(safeReturnPath('/learn/ikhfa-haqiqi/')).toBe('/learn/ikhfa-haqiqi/');
  expect(safeReturnPath('/reading-guide/?surah=113&ayah=2')).toBe('/reading-guide/?surah=113&ayah=2');
});

it('rejects invalid API configuration rather than inventing availability',()=>{
  for(const value of [undefined,'not a url','javascript:alert(1)','https://user:password@api.test','https://api.test/api/v1','https://api.test/?secret=x']) expect(parseApiUrl(value)).toBe('');
  expect(parseApiUrl('http://localhost:4000/')).toBe('http://localhost:4000');
  expect(parseApiUrl('https://api.example.com')).toBe('https://api.example.com');
});

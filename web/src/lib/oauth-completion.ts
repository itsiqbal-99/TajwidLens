export const oauthChannel = 'tajwidlens-oauth-completion';
export type OAuthCompletion = {type:'complete';id:string;next:'/home/'|'/profile/?welcome=1'};
export function isOAuthCompletion(value: unknown): value is OAuthCompletion {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<OAuthCompletion>;
  return message.type === 'complete' && typeof message.id === 'string' && /^[a-f0-9-]{36}$/.test(message.id)
    && (message.next === '/home/' || message.next === '/profile/?welcome=1');
}

export const oauthChannel = "tajwidlens-oauth-completion";
export const oauthStorageKey = "tajwidlens-oauth-completion";
export type OAuthCompletion = { type: "complete"; id: string };

export function isOAuthCompletionId(value: string | null) {
  return typeof value === "string" && /^[a-f0-9-]{36}$/.test(value);
}

export function isOAuthCompletion(value: unknown): value is OAuthCompletion {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<OAuthCompletion>;
  return Object.keys(value).length === 2 && message.type === "complete" && isOAuthCompletionId(message.id ?? null);
}

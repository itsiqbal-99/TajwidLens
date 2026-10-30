import "dotenv/config";

export function readConfig(env = process.env) {
  const production = env.NODE_ENV === "production";
  const allowUnverifiedEmail = env.AUTH_ALLOW_UNVERIFIED_EMAIL === "true";
  if (
    allowUnverifiedEmail &&
    !["development", "test"].includes(env.NODE_ENV || "")
  )
    throw new Error("AUTH_ALLOW_UNVERIFIED_EMAIL is development/test only");
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const db = new URL(databaseUrl);
  if (!["postgres:", "postgresql:"].includes(db.protocol))
    throw new Error("PostgreSQL required");
  // URL SSL parameters can override pg certificate verification.
  for (const key of [...db.searchParams.keys()])
    if (key.startsWith("ssl")) db.searchParams.delete(key);
  const frontends = (env.FRONTEND_URL || "http://localhost:3000")
    .split(",")
    .map((value) => new URL(value.trim()));
  const frontend = frontends[0];
  const api = new URL(env.API_URL || "http://localhost:4000");
  if (
    production &&
    (frontends.some((url) => url.protocol !== "https:") ||
      api.protocol !== "https:")
  )
    throw new Error("HTTPS required");
  const localDb = ["localhost", "127.0.0.1", "[::1]"].includes(db.hostname);
  const googleEnabled = !!env.GOOGLE_CLIENT_ID;
  if (googleEnabled && !env.GOOGLE_CLIENT_SECRET)
    throw new Error("GOOGLE_CLIENT_SECRET required");
  if (env.SMTP_HOST && (!env.SMTP_FROM || !env.SMTP_USER || !env.SMTP_PASSWORD))
    throw new Error("SMTP configuration incomplete");
  const proxySecret = env.API_PROXY_SECRET;
  if (
    production &&
    (!proxySecret || Buffer.byteLength(proxySecret, "utf8") < 32)
  )
    throw new Error("API_PROXY_SECRET must contain at least 32 random bytes");
  const quizChallengeSecret = env.QUIZ_CHALLENGE_SECRET;
  if (
    production &&
    (!quizChallengeSecret ||
      Buffer.byteLength(quizChallengeSecret, "utf8") < 32)
  )
    throw new Error(
      "QUIZ_CHALLENGE_SECRET must contain at least 32 random bytes",
    );
  if (
    quizChallengeSecret &&
    Buffer.byteLength(quizChallengeSecret, "utf8") < 32
  )
    throw new Error(
      "QUIZ_CHALLENGE_SECRET must contain at least 32 random bytes",
    );
  const port = Number(env.PORT || 4000);
  const smtpPort = Number(env.SMTP_PORT || 587);
  const databasePoolMax = Number(
    env.DATABASE_POOL_MAX || (production ? 3 : 10),
  );
  if (
    ![port, smtpPort].every((n) => Number.isInteger(n) && n > 0 && n <= 65535)
  )
    throw new Error("Invalid port");
  if (
    !Number.isInteger(databasePoolMax) ||
    databasePoolMax < 1 ||
    databasePoolMax > 20
  )
    throw new Error("DATABASE_POOL_MAX must be between 1 and 20");
  return {
    production,
    allowUnverifiedEmail,
    port,
    databaseUrl: db.toString(),
    ssl:
      production || !localDb
        ? { rejectUnauthorized: true as const }
        : (false as const),
    frontend: frontend.toString().replace(/\/$/, ""),
    origin: frontend.origin,
    origins: [...new Set(frontends.map((url) => url.origin))],
    api: api.origin,
    cookieName: production ? "__Host-tajwidlens" : "tajwidlens",
    sameSite: "lax" as const,
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    smtpHost: env.SMTP_HOST,
    smtpPort,
    smtpUser: env.SMTP_USER,
    smtpPassword: env.SMTP_PASSWORD,
    smtpFrom: env.SMTP_FROM,
    proxySecret,
    quizChallengeSecret,
    databasePoolMax,
  };
}
export type AppConfig = ReturnType<typeof readConfig>;
export const CONFIG = Symbol("CONFIG");

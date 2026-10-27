type PagesContext = {
  request: Request;
  env: { AUTH_API_ORIGIN?: string };
};

const hopByHopHeaders = ["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade"];

function trustedOrigin(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.origin === value.replace(/\/$/, "") ? url.origin : null;
  } catch {
    return null;
  }
}

export async function onRequest({ request, env }: PagesContext) {
  const origin = trustedOrigin(env.AUTH_API_ORIGIN);
  if (!origin) return new Response("Authentication proxy is not configured.", { status: 503 });

  const incoming = new URL(request.url);
  if (!incoming.pathname.startsWith("/api/v1/")) return new Response("Not found.", { status: 404 });

  const headers = new Headers(request.headers);
  hopByHopHeaders.forEach(header => headers.delete(header));
  headers.delete("host");
  const upstreamRequest = new Request(origin + incoming.pathname + incoming.search, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
    redirect: "manual",
  });
  let upstream: Response;
  try {
    upstream = await fetch(upstreamRequest);
  } catch {
    return new Response("Authentication service unavailable.", { status: 502 });
  }

  const location = upstream.headers.get("location");
  if (location) {
    const redirect = new URL(location, origin);
    if (![incoming.origin, "https://accounts.google.com"].includes(redirect.origin))
      return new Response("Upstream redirect rejected.", { status: 502 });
  }

  const responseHeaders = new Headers(upstream.headers);
  hopByHopHeaders.forEach(header => responseHeaders.delete(header));
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

const ALLOWED_SUFFIXES = [
  ".execute-api.ap-southeast-1.amazonaws.com",
  ".izteach.vn",
  ".iztv.io.vn",
  ".cloudfront.net",
] as const;

function isAllowedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "izteach.vn" || h === "iztv.io.vn") return true;
  if (ALLOWED_SUFFIXES.some((s) => h.endsWith(s))) return true;
  if (h.endsWith(".amazonaws.com") && (h.includes("s3") || h.includes("izteach"))) {
    return true;
  }
  return false;
}

const PASS_REQUEST = ["authorization", "accept", "content-type", "range"] as const;
const PASS_RESPONSE = [
  "content-type",
  "cache-control",
  "content-length",
  "accept-ranges",
  "content-range",
  "etag",
  "last-modified",
] as const;

export async function proxyIzteach(request: Request): Promise<Response> {
  const incoming = new URL(request.url);
  const target = incoming.searchParams.get("url");
  if (!target) {
    return Response.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return Response.json({ error: "Invalid url" }, { status: 400 });
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return Response.json({ error: "Unsupported protocol" }, { status: 400 });
  }
  if (!isAllowedHost(parsed.hostname)) {
    return Response.json({ error: "Host not allowed" }, { status: 403 });
  }

  const headers = new Headers();
  for (const name of PASS_REQUEST) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (!headers.has("Accept")) headers.set("Accept", "application/json, */*");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "follow",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(parsed.toString(), init);
    const outHeaders = new Headers();
    for (const name of PASS_RESPONSE) {
      const value = upstream.headers.get(name);
      if (value) outHeaders.set(name, value);
    }
    outHeaders.set("Access-Control-Allow-Origin", "*");
    const body = await upstream.arrayBuffer();
    return new Response(body, { status: upstream.status, headers: outHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upstream fetch failed";
    return Response.json({ error: message }, { status: 502 });
  }
}

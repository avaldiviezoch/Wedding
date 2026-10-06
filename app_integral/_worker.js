const FRAME_PROTECTION_HEADERS = {
  "Content-Security-Policy": "frame-ancestors 'none'",
  "X-Frame-Options": "DENY",
};

const OBSERVABILITY_PATH = "/api/observability";
const OBSERVABILITY_ORIGINS = new Set([
  "https://migrandiapp.com",
  "https://www.migrandiapp.com"
]);

function withFrameProtection(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(FRAME_PROTECTION_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function clean(value, max = 500) {
  return String(value ?? "").replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
}

function redact(value, max = 500) {
  return clean(value, max)
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email]")
    .replace(/(?:\+?\d[\s().-]*){9,15}/g, "[phone]");
}

function observabilityHeaders(origin) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };
  if (OBSERVABILITY_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Vary"] = "Origin";
  }
  return headers;
}

function observabilityJson(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: observabilityHeaders(origin)
  });
}

async function recordObservability(request, origin) {
  if (!OBSERVABILITY_ORIGINS.has(origin)) return observabilityJson({ ok: false }, 403, origin);
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 8192) return observabilityJson({ ok: false }, 413, origin);

  let value;
  try {
    value = await request.json();
  } catch {
    return observabilityJson({ ok: false }, 400, origin);
  }

  const event = {
    type: redact(value?.type, 80),
    error: {
      name: redact(value?.error?.name, 80),
      message: redact(value?.error?.message, 500),
      stack: redact(value?.error?.stack, 1600)
    },
    context: {
      version: redact(value?.context?.version, 80),
      environment: redact(value?.context?.environment, 40),
      path: redact(value?.context?.path, 220),
      module: redact(value?.context?.module, 80),
      operation: redact(value?.context?.operation, 80),
      source: redact(value?.context?.source, 220),
      browser: redact(value?.context?.browser, 40),
      device: redact(value?.context?.device, 40),
      viewport: redact(value?.context?.viewport, 40),
      online: Boolean(value?.context?.online),
      line: Number(value?.context?.line || 0),
      column: Number(value?.context?.column || 0)
    },
    at: redact(value?.at, 40)
  };

  console.log("MGD_OBSERVABILITY", JSON.stringify(event));
  return observabilityJson({ ok: true }, 202, origin);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (url.pathname === OBSERVABILITY_PATH) {
      if (request.method === "OPTIONS") {
        if (!OBSERVABILITY_ORIGINS.has(origin)) return new Response(null, { status: 403 });
        return new Response(null, { status: 204, headers: observabilityHeaders(origin) });
      }
      if (request.method !== "POST") return observabilityJson({ ok: false }, 405, origin);
      return recordObservability(request, origin);
    }

    const response = await env.ASSETS.fetch(request);
    return withFrameProtection(response);
  },
};

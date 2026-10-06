const FRAME_PROTECTION_HEADERS = {
  "Content-Security-Policy": "frame-ancestors 'none'",
  "X-Frame-Options": "DENY",
};

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

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    return withFrameProtection(response);
  },
};

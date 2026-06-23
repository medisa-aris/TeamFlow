import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const cookieStore = await cookies();
  const token = cookieStore.get('tf_access')?.value;
  if (!token) return new Response('Unauthorized', { status: 401 });

  // Only the connection handshake is time-bounded — once headers arrive, the
  // stream itself stays open indefinitely, governed solely by req.signal (client disconnect).
  const connectController = new AbortController();
  req.signal.addEventListener('abort', () => connectController.abort());
  const connectTimer = setTimeout(() => connectController.abort(), 10_000);

  let upstream;
  try {
    upstream = await fetch(`${process.env.NEXTJS_INTERNAL_URL}/api/v1/events/stream`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream', 'Cache-Control': 'no-cache' },
      signal: connectController.signal,
    });
  } catch {
    return new Response('SSE unavailable', { status: 504 });
  } finally {
    clearTimeout(connectTimer);
  }

  if (!upstream.ok || !upstream.body) {
    return new Response('SSE unavailable', { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

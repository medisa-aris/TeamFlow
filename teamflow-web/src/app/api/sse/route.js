import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const cookieStore = await cookies();
  const token = cookieStore.get('tf_access')?.value;
  if (!token) return new Response('Unauthorized', { status: 401 });

  const upstream = await fetch(`${process.env.NEXTJS_INTERNAL_URL}/api/v1/events/stream`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream', 'Cache-Control': 'no-cache' },
    signal: req.signal,
  });

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

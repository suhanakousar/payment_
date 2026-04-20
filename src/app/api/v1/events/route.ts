import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, isDevBypass } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HEARTBEAT_INTERVAL = 15000;
const POLL_INTERVAL = 4000;

export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user && !isDevBypass(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      send({ type: 'connected', timestamp: new Date().toISOString() });

      let lastTxnId: string | null = null;
      let lastPayoutId: string | null = null;
      let lastDisputeId: string | null = null;
      let lastChargebackId: string | null = null;

      try {
        const latestTxn = await prisma.transaction.findFirst({ orderBy: { createdAt: 'desc' } });
        lastTxnId = latestTxn?.id ?? null;
        const latestPayout = await prisma.payout.findFirst({ orderBy: { createdAt: 'desc' } });
        lastPayoutId = latestPayout?.id ?? null;
        const latestDispute = await prisma.dispute.findFirst({ orderBy: { createdAt: 'desc' } });
        lastDisputeId = latestDispute?.id ?? null;
        const latestChargeback = await prisma.chargeback.findFirst({ orderBy: { createdAt: 'desc' } });
        lastChargebackId = latestChargeback?.id ?? null;
      } catch {}

      const pollTimer = setInterval(async () => {
        if (closed) return;
        try {
          const newTxns = await prisma.transaction.findMany({
            where: lastTxnId
              ? { createdAt: { gt: (await prisma.transaction.findUnique({ where: { id: lastTxnId } }))?.createdAt ?? new Date(0) } }
              : { createdAt: { gt: new Date(Date.now() - POLL_INTERVAL * 2) } },
            orderBy: { createdAt: 'asc' },
            take: 10,
          });
          for (const txn of newTxns) {
            send({ type: 'transaction', action: 'created', id: txn.id, status: txn.status, amount: txn.amount, gateway: txn.gateway, timestamp: txn.createdAt.toISOString() });
            lastTxnId = txn.id;
          }

          const newPayouts = await prisma.payout.findMany({
            where: lastPayoutId
              ? { createdAt: { gt: (await prisma.payout.findUnique({ where: { id: lastPayoutId } }))?.createdAt ?? new Date(0) } }
              : { createdAt: { gt: new Date(Date.now() - POLL_INTERVAL * 2) } },
            orderBy: { createdAt: 'asc' },
            take: 5,
          });
          for (const p of newPayouts) {
            send({ type: 'payout', action: 'created', id: p.id, status: p.status, amount: p.amount, timestamp: p.createdAt.toISOString() });
            lastPayoutId = p.id;
          }

          const newDisputes = await prisma.dispute.findMany({
            where: lastDisputeId
              ? { createdAt: { gt: (await prisma.dispute.findUnique({ where: { id: lastDisputeId } }))?.createdAt ?? new Date(0) } }
              : { createdAt: { gt: new Date(Date.now() - POLL_INTERVAL * 2) } },
            orderBy: { createdAt: 'asc' },
            take: 5,
          });
          for (const d of newDisputes) {
            send({ type: 'dispute', action: 'created', id: d.id, status: d.status, timestamp: d.createdAt.toISOString() });
            lastDisputeId = d.id;
          }

          const newChargebacks = await prisma.chargeback.findMany({
            where: lastChargebackId
              ? { createdAt: { gt: (await prisma.chargeback.findUnique({ where: { id: lastChargebackId } }))?.createdAt ?? new Date(0) } }
              : { createdAt: { gt: new Date(Date.now() - POLL_INTERVAL * 2) } },
            orderBy: { createdAt: 'asc' },
            take: 5,
          });
          for (const cb of newChargebacks) {
            send({ type: 'chargeback', action: 'created', id: cb.id, status: cb.status, timestamp: cb.createdAt.toISOString() });
            lastChargebackId = cb.id;
          }
        } catch {}
      }, POLL_INTERVAL);

      const heartbeatTimer = setInterval(() => {
        send({ type: 'heartbeat', timestamp: new Date().toISOString() });
      }, HEARTBEAT_INTERVAL);

      request.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(pollTimer);
        clearInterval(heartbeatTimer);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

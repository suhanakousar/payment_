/**
 * Next.js instrumentation hook — runs once on server startup.
 * Used to start the background cron job for expiring chargebacks.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = await import('node-cron');

    // Every 5 minutes: expire overdue PENDING chargebacks
    cron.schedule('*/5 * * * *', async () => {
      try {
        const { default: prisma } = await import('@/lib/prisma');
        const result = await prisma.chargeback.updateMany({
          where: { status: 'PENDING', deadline: { lt: new Date() } },
          data:  { status: 'EXPIRED' },
        });
        if (result.count > 0) {
          console.log(`[cron] Expired ${result.count} overdue chargeback(s)`);
        }
      } catch (err) {
        console.error('[cron] chargeback expiry error:', err);
      }
    });

    console.log('[instrumentation] Chargeback expiry cron registered (every 5 min)');
  }
}

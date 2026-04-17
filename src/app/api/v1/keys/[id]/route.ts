import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const meta = () => ({ request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() });

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: `API key '${id}' not found` }, meta: meta() },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id:           key.id,
        name:         key.name,
        key_prefix:   key.keyPrefix,
        environment:  key.environment,
        scope:        key.scope,
        is_active:    key.isActive,
        last_used_at: key.lastUsedAt?.toISOString() ?? null,
        expires_at:   key.expiresAt?.toISOString()  ?? null,
        created_at:   key.createdAt.toISOString(),
      },
      meta: meta(),
    });
  } catch (err) {
    console.error('[GET /keys/:id]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: `API key '${id}' not found` }, meta: meta() },
        { status: 404 }
      );
    }
    if (!key.isActive) {
      return NextResponse.json(
        { success: false, error: { code: 'KEY_ALREADY_REVOKED', message: `API key '${id}' is already revoked` }, meta: meta() },
        { status: 409 }
      );
    }

    const now = new Date();
    await prisma.apiKey.update({ where: { id }, data: { isActive: false } });

    return NextResponse.json({
      success: true,
      data: {
        id:          key.id,
        name:        key.name,
        key_prefix:  key.keyPrefix,
        environment: key.environment,
        is_active:   false,
        revoked_at:  now.toISOString(),
        message:     `API key '${key.name}' has been revoked. All requests using this key will be rejected immediately.`,
      },
      meta: meta(),
    });
  } catch (err) {
    console.error('[DELETE /keys/:id]', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

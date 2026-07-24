'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { items, claims, profiles } from '@/lib/schema';
import { headers } from 'next/headers';
import { sql, eq, and, ne } from 'drizzle-orm';
import { encryptAnswer, decryptAnswer } from '@/lib/crypto';

export async function submitClaimAction(itemId: string, answer1: string, answer2: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [item] = await db
    .select({ status: items.status, finderId: items.finderId })
    .from(items)
    .where(eq(items.id, itemId));

  if (!item || item.status !== 'active') throw new Error('Item not available');
  if (item.finderId === session.user.id) throw new Error('You cannot claim your own report');

  const setConfig = sql`SELECT set_config('app.current_user_id', ${session.user.id}, true)`;

  const [, existingRows] = await db.batch([
    db.execute(setConfig),
    db
      .select({ id: claims.id, status: claims.status })
      .from(claims)
      .where(and(eq(claims.itemId, itemId), eq(claims.claimerId, session.user.id))),
  ]);
  const existing = existingRows[0];

  if (!existing) {
    await db.batch([
      db.execute(setConfig),
      db.insert(claims).values({
        itemId,
        claimerId: session.user.id,
        answer1: encryptAnswer(answer1),
        answer2: encryptAnswer(answer2),
      }),
    ]);
  } else if (existing.status === 'rejected') {
    await db.batch([
      db.execute(setConfig),
      db
        .update(claims)
        .set({
          answer1: encryptAnswer(answer1),
          answer2: encryptAnswer(answer2),
          status: 'pending_review',
          finderConfirmed: false,
          claimerConfirmed: false,
          resolvedAt: null,
        })
        .where(eq(claims.id, existing.id)),
    ]);
  } else {
    throw new Error('You already have a claim on this item');
  }
}

export async function reviewClaimAction(claimId: string, decision: 'approve' | 'reject') {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [claim] = await db
    .select({
      status: claims.status,
      itemId: claims.itemId,
      itemStatus: items.status,
      finderId: items.finderId,
    })
    .from(claims)
    .innerJoin(items, eq(items.id, claims.itemId))
    .where(eq(claims.id, claimId));

  if (!claim) throw new Error('Claim not found');
  if (claim.finderId !== session.user.id) throw new Error('Forbidden');
  if (claim.status !== 'pending_review') throw new Error('This claim has already been reviewed');
  if (claim.itemStatus !== 'active') {
    throw new Error('This report is no longer active — it may already be claimed or closed');
  }

  const setConfig = sql`SELECT set_config('app.current_user_id', ${session.user.id}, true)`;
  const status = decision === 'approve' ? 'approved' : 'rejected';

  if (decision === 'approve') {
    await db.batch([
      db.execute(setConfig),
      db.update(claims).set({ status }).where(eq(claims.id, claimId)),
      db.update(items).set({ status: 'claimed' }).where(eq(items.id, claim.itemId)),
      db
        .update(claims)
        .set({ status: 'rejected' })
        .where(
          and(eq(claims.itemId, claim.itemId), ne(claims.id, claimId), eq(claims.status, 'pending_review'))
        ),
    ]);
  } else {
    await db.batch([
      db.execute(setConfig),
      db.update(claims).set({ status }).where(eq(claims.id, claimId)),
    ]);
  }
}

export async function confirmHandoverAction(claimId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [claim] = await db
    .select({ itemId: claims.itemId, claimerId: claims.claimerId, finderId: items.finderId })
    .from(claims)
    .innerJoin(items, eq(items.id, claims.itemId))
    .where(eq(claims.id, claimId));

  if (!claim) throw new Error('Claim not found');
  const role = session.user.id === claim.finderId ? 'finder' : session.user.id === claim.claimerId ? 'claimer' : null;
  if (!role) throw new Error('Forbidden');

  const setConfig = sql`SELECT set_config('app.current_user_id', ${session.user.id}, true)`;

  const [, updatedRows] = await db.batch([
    db.execute(setConfig),
    db
      .update(claims)
      .set(role === 'finder' ? { finderConfirmed: true } : { claimerConfirmed: true })
      .where(eq(claims.id, claimId))
      .returning({ finderConfirmed: claims.finderConfirmed, claimerConfirmed: claims.claimerConfirmed }),
  ]);
  const updated = updatedRows[0];

  if (updated?.finderConfirmed && updated?.claimerConfirmed) {
    await db.batch([
      db.execute(setConfig),
      db.update(claims).set({ resolvedAt: new Date() }).where(eq(claims.id, claimId)),
      db.update(items).set({ status: 'closed' }).where(eq(items.id, claim.itemId)),
    ]);
  }
}

export async function getClaimReview(claimId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [row] = await db
    .select({
      claimId: claims.id,
      claimerId: claims.claimerId,
      status: claims.status,
      finderConfirmed: claims.finderConfirmed,
      claimerConfirmed: claims.claimerConfirmed,
      answer1: claims.answer1,
      answer2: claims.answer2,
      itemId: items.id,
      itemTitle: items.title,
      itemCategory: items.category,
      itemImageUrl: items.imageUrl,
      itemFinderId: items.finderId,
      itemQuestion1: items.question1,
      itemQuestion2: items.question2,
      itemAnswer1: items.answer1,
      itemAnswer2: items.answer2,
      claimerDisplayName: profiles.displayName,
      claimerWhatsapp: profiles.whatsappNumber,
      claimerDocType: profiles.docType,
      claimerDocLastFour: profiles.docLastFour,
    })
    .from(claims)
    .innerJoin(items, eq(items.id, claims.itemId))
    .innerJoin(profiles, eq(profiles.id, claims.claimerId))
    .where(eq(claims.id, claimId));

  if (!row) return null;
  if (session.user.id !== row.itemFinderId && session.user.id !== row.claimerId) {
    throw new Error('Forbidden');
  }

  const [finderProfile] = await db
    .select({ whatsappNumber: profiles.whatsappNumber })
    .from(profiles)
    .where(eq(profiles.id, row.itemFinderId));

  return {
    claimId: row.claimId,
    status: row.status,
    finderConfirmed: row.finderConfirmed,
    claimerConfirmed: row.claimerConfirmed,
    answer1: decryptAnswer(row.answer1),
    answer2: decryptAnswer(row.answer2),
    item: {
      id: row.itemId,
      title: row.itemTitle,
      category: row.itemCategory,
      imageUrl: row.itemImageUrl,
      finderId: row.itemFinderId,
      finderWhatsappNumber: finderProfile?.whatsappNumber ?? '',
      questions: [row.itemQuestion1, row.itemQuestion2] as [string, string],
      referenceAnswers: [decryptAnswer(row.itemAnswer1), decryptAnswer(row.itemAnswer2)] as [string, string],
    },
    claimer: {
      displayName: row.claimerDisplayName,
      whatsappNumber: row.claimerWhatsapp,
      docType: row.claimerDocType,
      docLastFour: row.claimerDocLastFour,
    },
  };
}

export async function getMyClaims() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return [];

  const rows = await db
    .select({
      id: claims.id,
      status: claims.status,
      answer1: claims.answer1,
      answer2: claims.answer2,
      finderConfirmed: claims.finderConfirmed,
      claimerConfirmed: claims.claimerConfirmed,
      itemId: items.id,
      itemTitle: items.title,
      itemCategory: items.category,
      itemImage: items.imageUrl,
      itemStatus: items.status,
      createdAt: claims.createdAt,
    })
    .from(claims)
    .innerJoin(items, eq(items.id, claims.itemId))
    .where(eq(claims.claimerId, session.user.id))
    .orderBy(sql`${claims.createdAt} DESC`);

  return rows.map((r) => ({ ...r, answer1: decryptAnswer(r.answer1), answer2: decryptAnswer(r.answer2) }));
}
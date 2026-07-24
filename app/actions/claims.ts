'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { items, claims, profiles } from '@/lib/schema';
import { headers } from 'next/headers';
import { sql, eq } from 'drizzle-orm';

export async function submitClaimAction(itemId: string, answer1: string, answer2: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [item] = await db
    .select({ status: items.status, finderId: items.finderId })
    .from(items)
    .where(eq(items.id, itemId));

  if (!item || item.status !== 'active') throw new Error('Item not available');
  if (item.finderId === session.user.id) throw new Error('You cannot claim your own report');

  await db.execute(
    sql`SELECT set_config('app.current_user_id', ${session.user.id}, true)`
  );

  await db.insert(claims).values({
    itemId,
    claimerId: session.user.id,
    answer1,
    answer2,
  });
}

export async function reviewClaimAction(claimId: string, decision: 'approve' | 'reject') {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db.execute(
    sql`SELECT set_config('app.current_user_id', ${session.user.id}, true)`
  );

  const status = decision === 'approve' ? 'approved' : 'rejected';
  await db
    .update(claims)
    .set({ status })
    .where(eq(claims.id, claimId));

  if (decision === 'approve') {
    await db.execute(
      sql`UPDATE items SET status = 'claimed' WHERE id IN (SELECT item_id FROM claims WHERE id = ${claimId})`
    );
  }
}

export async function confirmHandoverAction(claimId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db.execute(
    sql`SELECT set_config('app.current_user_id', ${session.user.id}, true)`
  );

  const [claim] = await db
    .select({ itemId: claims.itemId, claimerId: claims.claimerId, finderId: items.finderId })
    .from(claims)
    .innerJoin(items, eq(items.id, claims.itemId))
    .where(eq(claims.id, claimId));

  if (!claim) throw new Error('Claim not found');
  const role = session.user.id === claim.finderId ? 'finder' : session.user.id === claim.claimerId ? 'claimer' : null;
  if (!role) throw new Error('Forbidden');

  if (role === 'finder') {
    await db.update(claims).set({ finderConfirmed: true }).where(eq(claims.id, claimId));
  } else {
    await db.update(claims).set({ claimerConfirmed: true }).where(eq(claims.id, claimId));
  }

  const [updated] = await db
    .select({ finderConfirmed: claims.finderConfirmed, claimerConfirmed: claims.claimerConfirmed })
    .from(claims)
    .where(eq(claims.id, claimId));

  if (updated.finderConfirmed && updated.claimerConfirmed) {
    await db
      .update(claims)
      .set({ resolvedAt: new Date() })
      .where(eq(claims.id, claimId));
    await db.execute(
      sql`UPDATE items SET status = 'closed' WHERE id = ${claim.itemId}`
    );
  }
}

export async function getClaimReview(claimId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db.execute(
    sql`SELECT set_config('app.current_user_id', ${session.user.id}, true)`
  );

  const [row] = await db
    .select({
      claimId: claims.id,
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

  return {
    claimId: row.claimId,
    status: row.status,
    finderConfirmed: row.finderConfirmed,
    claimerConfirmed: row.claimerConfirmed,
    answer1: row.answer1,
    answer2: row.answer2,
    item: {
      id: row.itemId,
      title: row.itemTitle,
      category: row.itemCategory,
      imageUrl: row.itemImageUrl,
      finderId: row.itemFinderId,
      questions: [row.itemQuestion1, row.itemQuestion2] as [string, string],
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

  return db
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
}
'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { items, claims, profiles } from '@/lib/schema';
import { headers } from 'next/headers';
import { sql, eq, and, gte } from 'drizzle-orm';
import { pickQuestions } from '@/lib/questions';
import { fuzzCoordinate, reverseGeocode } from '@/lib/location';
import { uploadToR2 } from '@/lib/r2';
import crypto from 'crypto';

async function hashAnswer(answer: string, salt: string): Promise<string> {
  return crypto.createHash('sha256').update(`${salt}:${answer.toLowerCase().trim()}`).digest('hex');
}

export async function createItemAction(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('Unauthorized');

  const title = String(formData.get('title') ?? '').trim();
  const category = String(formData.get('category') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const lat = parseFloat(String(formData.get('lat') ?? ''));
  const lng = parseFloat(String(formData.get('lng') ?? ''));
  const answer1 = String(formData.get('answer1') ?? '').trim();
  const answer2 = String(formData.get('answer2') ?? '').trim();

  let imagesBase64: string[] = [];
  try {
    imagesBase64 = JSON.parse(String(formData.get('imagesBase64') ?? '[]'));
  } catch {
    imagesBase64 = [];
  }
  imagesBase64 = imagesBase64.filter(Boolean).slice(0, 3);

  const [q1, q2] = pickQuestions(category);
  const salt = crypto.randomBytes(16).toString('hex');
  const answer1Hash = `${salt}:${await hashAnswer(answer1, salt)}`;
  const answer2Hash = `${salt}:${await hashAnswer(answer2, salt)}`;

  const imageUrls: string[] = [];
  for (const base64 of imagesBase64) {
    const matches = base64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) continue;
    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const key = `items/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.jpg`;
    imageUrls.push(await uploadToR2(key, buffer, contentType));
  }
  const imageUrl = imageUrls[0] ?? '';

  const fuzzed = fuzzCoordinate(lat, lng);
  const locationName = await reverseGeocode(lat, lng);

  await db.execute(
    sql`SELECT set_config('app.current_user_id', ${session.user.id}, true)`
  );

  await db.insert(items).values({
    finderId: session.user.id,
    title,
    category,
    description,
    imageUrl,
    imageUrls,
    locationName,
    fuzzedLocation: sql`ST_SetSRID(ST_MakePoint(${fuzzed.lng}, ${fuzzed.lat}), 4326)`,
    rawLocation: sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`,
    question1: q1,
    question2: q2,
    answer1Hash,
    answer2Hash,
  });
}

const PUBLIC_ITEMS_PAGE_SIZE = 24;

const publicItemColumns = {
  id: items.id,
  title: items.title,
  category: items.category,
  description: items.description,
  imageUrl: items.imageUrl,
  locationName: items.locationName,
  lat: sql<number>`ST_Y(${items.fuzzedLocation}::geometry)`,
  lng: sql<number>`ST_X(${items.fuzzedLocation}::geometry)`,
  status: items.status,
  createdAt: items.createdAt,
};

export interface GetPublicItemsParams {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  page?: number;
}

export interface PublicItem {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  locationName: string;
  lat: number;
  lng: number;
  status: string;
  createdAt: Date;
}

// ST_DWithin uses the GIST index on fuzzed_location (see schema.sql) instead of
// filtering in JS after the fact, which silently missed matches past one page
export async function getPublicItems({
  lat,
  lng,
  radiusKm = 25,
  page = 0,
}: GetPublicItemsParams): Promise<{ items: PublicItem[]; hasMore: boolean }> {
  const hasGeo = lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng);
  const offset = Math.max(0, page) * PUBLIC_ITEMS_PAGE_SIZE;
  const fetchLimit = PUBLIC_ITEMS_PAGE_SIZE + 1;

  const rows = hasGeo
    ? await db
        .select(publicItemColumns)
        .from(items)
        .where(
          sql`ST_DWithin(${items.fuzzedLocation}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusKm * 1000})`
        )
        .orderBy(sql`ST_Distance(${items.fuzzedLocation}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) ASC`)
        .limit(fetchLimit)
        .offset(offset)
    : await db
        .select(publicItemColumns)
        .from(items)
        .orderBy(sql`${items.createdAt} DESC`)
        .limit(fetchLimit)
        .offset(offset);

  const hasMore = rows.length > PUBLIC_ITEMS_PAGE_SIZE;
  return { items: rows.slice(0, PUBLIC_ITEMS_PAGE_SIZE), hasMore };
}

export async function getItemByIdPublic(id: string) {
  const [item] = await db
    .select({
      id: items.id,
      title: items.title,
      category: items.category,
      description: items.description,
      imageUrl: items.imageUrl,
      imageUrls: items.imageUrls,
      locationName: items.locationName,
      lat: sql<number>`ST_Y(${items.fuzzedLocation}::geometry)`,
      lng: sql<number>`ST_X(${items.fuzzedLocation}::geometry)`,
      status: items.status,
      question1: items.question1,
      question2: items.question2,
      finderId: items.finderId,
    })
    .from(items)
    .where(eq(items.id, id));
  if (!item) return null;

  const claimsRaw = await db
    .select({
      id: claims.id,
      status: claims.status,
      claimerName: profiles.displayName,
      finderConfirmed: claims.finderConfirmed,
      claimerConfirmed: claims.claimerConfirmed,
      resolvedAt: claims.resolvedAt,
      createdAt: claims.createdAt,
    })
    .from(claims)
    .innerJoin(profiles, eq(profiles.id, claims.claimerId))
    .where(eq(claims.itemId, id))
    .orderBy(sql`${claims.createdAt} DESC`);

  return { ...item, claims: claimsRaw };
}

export async function getMyItems() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return [];

  return db
    .select({
      id: items.id,
      title: items.title,
      category: items.category,
      imageUrl: items.imageUrl,
      status: items.status,
      pendingClaims: sql<number>`(
        SELECT COUNT(*) FROM claims
        WHERE claims.item_id = ${items.id}
        AND claims.status = 'pending_review'
      )`,
    })
    .from(items)
    .where(eq(items.finderId, session.user.id))
    .orderBy(sql`${items.createdAt} DESC`);
}

export async function getMyItemDetail(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db.execute(
    sql`SELECT set_config('app.current_user_id', ${session.user.id}, true)`
  );

  const itemClaimsRaw = await db
    .select({
      id: claims.id,
      status: claims.status,
      answer1: claims.answer1,
      answer2: claims.answer2,
      finderConfirmed: claims.finderConfirmed,
      claimerConfirmed: claims.claimerConfirmed,
      resolvedAt: claims.resolvedAt,
      createdAt: claims.createdAt,
      claimerDisplayName: profiles.displayName,
      claimerDocType: profiles.docType,
      claimerDocLastFour: profiles.docLastFour,
    })
    .from(claims)
    .innerJoin(profiles, eq(profiles.id, claims.claimerId))
    .where(eq(claims.itemId, id))
    .orderBy(sql`${claims.createdAt} DESC`);

  const itemClaims = itemClaimsRaw.map((c) => ({
    id: c.id,
    status: c.status,
    answer1: c.answer1,
    answer2: c.answer2,
    finderConfirmed: c.finderConfirmed,
    claimerConfirmed: c.claimerConfirmed,
    resolvedAt: c.resolvedAt,
    createdAt: c.createdAt,
    claimer: {
      displayName: c.claimerDisplayName,
      docType: c.claimerDocType,
      docLastFour: c.claimerDocLastFour,
    },
  }));

  const [item] = await db
    .select({
      id: items.id,
      title: items.title,
      category: items.category,
      description: items.description,
      imageUrl: items.imageUrl,
      imageUrls: items.imageUrls,
      status: items.status,
    })
    .from(items)
    .where(eq(items.id, id));

  return item ? { ...item, claims: itemClaims } : null;
}

export async function deleteItemAction(itemId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db.execute(
    sql`SELECT set_config('app.current_user_id', ${session.user.id}, true)`
  );

  const [item] = await db
    .select({ finderId: items.finderId, status: items.status })
    .from(items)
    .where(eq(items.id, itemId));

  if (!item) throw new Error('Report not found');
  if (item.finderId !== session.user.id) throw new Error('Forbidden');
  if (item.status !== 'active') {
    throw new Error('This report has an in-progress or completed claim and can no longer be deleted');
  }

  await db.delete(items).where(eq(items.id, itemId));
}
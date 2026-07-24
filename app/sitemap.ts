import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { items } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://milgaya.vercel.app';

  // Base static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/items/new`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  try {
    // Fetch active items for dynamic indexing
    const activeItems = await db
      .select({
        id: items.id,
        createdAt: items.createdAt,
      })
      .from(items)
      .where(eq(items.status, 'active'))
      .orderBy(desc(items.createdAt))
      .limit(1000);

    const itemRoutes: MetadataRoute.Sitemap = activeItems.map((item) => ({
      url: `${baseUrl}/items/${item.id}`,
      lastModified: item.createdAt,
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    return [...routes, ...itemRoutes];
  } catch {
    // Fallback gracefully if database fetch fails during build
    return routes;
  }
}

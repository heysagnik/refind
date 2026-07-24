import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { headers } from 'next/headers';
import { profiles } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { Header } from '@/app/components/ui/Header';
import { Input, selectClassName } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';

async function updateProfile(formData: FormData) {
  'use server';
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('Unauthorized');

  const displayName = String(formData.get('displayName') ?? '').trim();
  const whatsappNumber = String(formData.get('whatsappNumber') ?? '').trim();
  const docType = String(formData.get('docType') ?? '').trim();
  const docLastFour = String(formData.get('docLastFour') ?? '').trim();

  await db.batch([
    db.execute(sql`SELECT set_config('app.current_user_id', ${session.user.id}, true)`),
    db
      .update(profiles)
      .set({ displayName, whatsappNumber, docType, docLastFour })
      .where(eq(profiles.id, session.user.id)),
  ]);

  redirect('/profile');
}

export default async function ProfileEditPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/auth/login?redirect=/profile/edit');

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, session.user.id));

  return (
    <main className="flex-1 flex flex-col px-6 md:px-8 lg:px-10 py-6 max-w-[640px] mx-auto w-full pb-24 md:pb-12">
      <Header title="Edit profile" backHref="/profile" />

      <form action={updateProfile} className="flex flex-col gap-4">
        <Input
          label="Display name"
          name="displayName"
          defaultValue={profile?.displayName || session.user.name || ''}
          placeholder="Your name"
        />
        <Input
          label="WhatsApp number"
          name="whatsappNumber"
          type="tel"
          defaultValue={profile?.whatsappNumber || ''}
          placeholder="+91 98765 43210"
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="docType" className="text-[13px] font-semibold text-ink-soft">
            ID document type
          </label>
          <select
            id="docType"
            name="docType"
            defaultValue={profile?.docType || ''}
            className={selectClassName}
          >
            <option value="">None</option>
            <option value="aadhaar">Aadhaar</option>
            <option value="dl">Driving licence</option>
            <option value="passport">Passport</option>
            <option value="voter">Voter ID</option>
            <option value="other">Other</option>
          </select>
        </div>
        <Input
          label="Last 4 digits of ID"
          name="docLastFour"
          inputMode="numeric"
          maxLength={4}
          defaultValue={profile?.docLastFour || ''}
          placeholder="0000"
        />
        <Button type="submit" className="mt-2 w-full">Save changes</Button>
      </form>
    </main>
  );
}
'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles } from '@/lib/schema';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function signupAction(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const displayName = String(formData.get('displayName') ?? '');
  const whatsappNumber = String(formData.get('whatsappNumber') ?? '');
  const docType = String(formData.get('docType') ?? '');
  const docLastFour = String(formData.get('docLastFour') ?? '');

  const result = await auth.api.signUpEmail({
    body: { email, password, name: displayName },
    headers: await headers(),
  });

  if (result?.user?.id) {
    await db.insert(profiles).values({
      id: result.user.id,
      displayName,
      whatsappNumber,
      docType,
      docLastFour,
    });
  }

  const redirectTo = String(formData.get('redirect') ?? '/');
  redirect(redirectTo);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const redirectTo = String(formData.get('redirect') ?? '/');

  await auth.api.signInEmail({
    body: { email, password },
    headers: await headers(),
  });

  redirect(redirectTo);
}

export async function logoutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect('/');
}
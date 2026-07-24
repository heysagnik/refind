import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { ReportForm } from '@/app/components/ReportForm';
import { Header } from '@/app/components/ui/Header';

export default async function NewItemPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/auth/signup?redirect=/items/new');

  return (
    <main className="flex-1 flex flex-col px-6 md:px-8 lg:px-10 py-6 max-w-[640px] mx-auto w-full pb-24 md:pb-12">
      <Header title="Report a find" subtitle="Help reunite this with its owner." backHref="/" />
      <ReportForm />
    </main>
  );
}
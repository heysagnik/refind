import { loginAction } from '@/app/actions/auth';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';

interface Props {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const redirectTo = params.redirect ?? '/';

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[440px] bg-surface border border-line rounded-xl shadow-elevated p-7 md:p-9">
        <div className="flex flex-col gap-1.5 mb-8">
          <h1 className="text-[28px] font-extrabold tracking-tight">Welcome back</h1>
          <p className="text-ink-soft text-[15px]">Log in to report or claim items.</p>
        </div>

        <form action={loginAction} className="flex flex-col gap-4">
          <input type="hidden" name="redirect" value={redirectTo} />
          <Input label="Email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
          <Input label="Password" name="password" type="password" required autoComplete="current-password" />

          <Button type="submit" className="mt-2 w-full">Log in</Button>
        </form>

        <p className="text-center mt-6 text-ink-soft text-sm">
          New to MilGaya?{' '}
          <a href={`/auth/signup?redirect=${encodeURIComponent(redirectTo)}`} className="text-accent font-semibold">
            Create an account
          </a>
        </p>
      </div>
    </main>
  );
}

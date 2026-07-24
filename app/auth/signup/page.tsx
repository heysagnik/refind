import { signupAction } from '@/app/actions/auth';
import { Input, selectClassName } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';

interface Props {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams;
  const redirectTo = params.redirect ?? '/';

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[440px] bg-surface border border-line rounded-xl shadow-elevated p-7 md:p-9">
        <div className="flex flex-col gap-1.5 mb-8">
          <h1 className="text-[28px] font-extrabold tracking-tight">Create account</h1>
          <p className="text-ink-soft text-[15px]">One quick step, then you can claim items.</p>
        </div>

        <form action={signupAction} className="flex flex-col gap-4">
          <input type="hidden" name="redirect" value={redirectTo} />

          <Input label="Name" name="displayName" required autoComplete="name" placeholder="Your name" />
          <Input label="Email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
          <Input label="Password" name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" />
          <Input label="WhatsApp number" name="whatsappNumber" type="tel" required autoComplete="tel" placeholder="+91 98765 43210" />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="docType" className="text-[13px] font-semibold text-ink-soft">
              ID document type
            </label>
            <select id="docType" name="docType" required className={selectClassName}>
              <option value="">Choose…</option>
              <option value="aadhaar">Aadhaar</option>
              <option value="dl">Driving licence</option>
              <option value="passport">Passport</option>
              <option value="voter">Voter ID</option>
              <option value="other">Other</option>
            </select>
          </div>

          <Input label="Last 4 digits of ID" name="docLastFour" inputMode="numeric" maxLength={4} pattern="[0-9]{4}" required placeholder="0000" />

          <Button type="submit" className="mt-2 w-full">Create account</Button>
        </form>

        <p className="text-center mt-6 text-ink-soft text-sm">
          Already have an account?{' '}
          <a href={`/auth/login?redirect=${encodeURIComponent(redirectTo)}`} className="text-accent font-semibold">
            Log in
          </a>
        </p>
      </div>
    </main>
  );
}

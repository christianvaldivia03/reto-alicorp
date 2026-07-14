'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, Sparkles, ScanEye } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { homeForRole } from '@/lib/roles';

const HIGHLIGHTS = [
  { icon: Sparkles, text: 'Generación de contenido con reglas de marca (RAG).' },
  { icon: ShieldCheck, text: 'Aprobación con separación estricta de funciones.' },
  { icon: ScanEye, text: 'Auditoría multimodal de imágenes contra el manual.' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await login(email, password);
      router.replace(homeForRole(user.rol));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciales inválidas');
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Panel de marca (asimétrico, solo desktop) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--brand), transparent 70%)' }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-foreground">
            C
          </span>
          <span className="text-lg font-semibold tracking-tight">Content Suite</span>
        </div>

        <div className="relative max-w-sm">
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-[1.1] tracking-tight">
            Consistencia de marca, impuesta por IA.
          </h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-primary-foreground/80">
                <Icon className="mt-0.5 size-5 flex-shrink-0 text-brand" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/50">
          Plataforma B2B · Alicorp IAGen
        </p>
      </aside>

      {/* Formulario */}
      <main className="flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <span className="mb-4 flex size-14 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-primary-foreground">
              C
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Content Suite</h1>
          </div>

          <div className="mb-8 hidden lg:block">
            <h1 className="text-2xl font-bold tracking-tight">Inicia sesión</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Accede a tu espacio de trabajo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

            <Field label="Correo electrónico" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                autoComplete="email"
                required
              />
            </Field>

            <Field label="Contraseña" htmlFor="password">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </Field>

            <Button type="submit" size="lg" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Ingresando…
                </>
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

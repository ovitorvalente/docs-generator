'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOutIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';

export default function Header() {
  const navegador = useRouter();
  const pathname = usePathname();
  const pagina_ativa =
    pathname === '/declaracao-residencia-responsabilidade'
      ? 'residencia_responsabilidade'
      : 'residencia';

  async function ao_clicar_sair() {
    try {
      await fetch('/api/sair', { method: 'POST' });
    } catch {
    } finally {
      navegador.push('/auth');
    }
  }

  return (
    <header className="flex w-full flex-wrap items-center gap-2 border-b border-dashed bg-background/50 px-3 py-2.5 backdrop-blur-sm md:px-6">
      <span className="mr-1 text-sm font-medium text-muted-foreground md:text-base">
        QUICK - Gerador de declarações
      </span>

      {pathname !== '/auth' && (
        <nav className="flex flex-1 flex-wrap items-center gap-1 ml-12">
          <Button
            asChild
            variant={pagina_ativa === 'residencia' ? 'secondary' : 'ghost'}
            className={cn(
              pagina_ativa === 'residencia' && 'border border-border'
            )}
          >
            <Link href="/declaracao-residencia">Residência</Link>
          </Button>
          <Button
            asChild
            variant={
              pagina_ativa === 'residencia_responsabilidade'
                ? 'secondary'
                : 'ghost'
            }
            className={cn(
              pagina_ativa === 'residencia_responsabilidade' &&
                'border border-border'
            )}
          >
            <Link href="/declaracao-residencia-responsabilidade">
              Residência + Responsabilidade
            </Link>
          </Button>
        </nav>
      )}

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <Button variant="destructive" onClick={ao_clicar_sair}>
          <LogOutIcon data-icon="inline-start" />
          Sair
        </Button>
      </div>
    </header>
  );
}

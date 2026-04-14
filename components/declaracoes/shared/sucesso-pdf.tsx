'use client';

import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { BadgeCheck } from 'lucide-react';

type PropsSucessoPDF = {
  on_concluir: () => void;
  descricao?: string;
  rotulo_botao?: string;
};

export function BlocoSucessoPDF({
  on_concluir,
  descricao = 'O download da declaração foi iniciado. Você será levado de volta para a etapa inicial automaticamente em alguns segundos.',
  rotulo_botao = 'Concluir',
}: PropsSucessoPDF) {
  return (
    <Item className="border-2 bg-emerald-100 border-emerald-500 dark:border-emerald-700/50 dark:bg-emerald-950/20 rounded-3xl">
      <ItemMedia>
        <BadgeCheck className="size-6 text-green-500" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>PDF gerado com sucesso</ItemTitle>
        <ItemDescription>{descricao}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button type="button" size="lg" onClick={on_concluir}>
          {rotulo_botao}
        </Button>
      </ItemActions>
    </Item>
  );
}

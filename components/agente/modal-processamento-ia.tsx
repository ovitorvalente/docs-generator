'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle2Icon,
  XCircleIcon,
  CircleIcon,
  TriangleAlertIcon,
  Loader,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type PassoProcessamento =
  | 'carregando_modelo'
  | 'extraindo_campos'
  | 'concluido'
  | 'erro';

type PropsModalProcessamentoIA = {
  aberto: boolean;
  onFechar: () => void;
  passo: PassoProcessamento;
  campos?: { chave: string; valor: string }[];
  mensagem_erro?: string | null;
  onContinuar?: () => void;
  onGerarPdf?: () => void;
  informacao_validacao?: string;
};

const ROTULOS_CAMPOS: Record<string, string> = {
  nome: 'Nome',
  documento_identidade: 'Documento de Identidade',
  orgao_expedidor: 'Órgão expedidor',
  cpf: 'CPF',
  nacionalidade: 'Nacionalidade',
  telefone: 'Telefone',
  email: 'E-mail',
  naturalidade: 'Naturalidade',
  endereco: 'Endereço',
  bairro: 'Bairro',
  cidade: 'Cidade',
  cep: 'CEP',
  uf: 'UF',
  complemento: 'Complemento',
};

const PASSOS: { id: PassoProcessamento; rotulo: string }[] = [
  { id: 'carregando_modelo', rotulo: 'Carregando modelo de IA no navegador' },
  { id: 'extraindo_campos', rotulo: 'Extraindo campos da mensagem' },
  { id: 'concluido', rotulo: 'Concluído' },
];

export function ModalProcessamentoIA({
  aberto,
  onFechar,
  passo,
  campos = [],
  mensagem_erro,
  onContinuar,
  onGerarPdf,
  informacao_validacao,
}: PropsModalProcessamentoIA) {
  const indice_passo_atual =
    passo === 'erro'
      ? 1
      : passo === 'concluido'
        ? 2
        : passo === 'extraindo_campos'
          ? 1
          : 0;

  const pode_fechar = passo === 'concluido' || passo === 'erro';

  return (
    <Dialog
      open={aberto}
      onOpenChange={(aberto: boolean) => !aberto && pode_fechar && onFechar()}
    >
      <DialogContent
        mostrar_botao_fechar={pode_fechar}
        onInteractOutside={(e) => !pode_fechar && e.preventDefault()}
        onEscapeKeyDown={(e) => !pode_fechar && e.preventDefault()}
        className="max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Processamento com IA</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            {PASSOS.map((item, indice) => {
              const concluido = indice <= indice_passo_atual;
              const em_andamento =
                indice === indice_passo_atual &&
                passo !== 'erro' &&
                passo !== 'concluido';
              const falhou = passo === 'erro' && indice === 1;

              return (
                <div key={item.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 shrink-0">
                    {em_andamento && (
                      <Loader className="size-5 animate-spin text-primary" />
                    )}
                    {concluido && !em_andamento && (
                      <CheckCircle2Icon className="size-5 text-green-500" />
                    )}
                    {falhou && (
                      <XCircleIcon className="size-5 text-destructive" />
                    )}
                    {!concluido && !em_andamento && !falhou && (
                      <CircleIcon className="size-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span
                      className={
                        concluido
                          ? 'text-muted-foreground'
                          : em_andamento || falhou
                            ? 'font-medium'
                            : 'text-muted-foreground'
                      }
                    >
                      {item.rotulo}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {passo === 'erro' && mensagem_erro && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <TriangleAlertIcon className="size-5 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{mensagem_erro}</p>
            </div>
          )}

          {passo === 'concluido' && campos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">Campos extraídos</h4>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex shrink-0 rounded-full p-0.5 text-amber-500 hover:bg-amber-500/10 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      aria-label="Informações de validação"
                    >
                      <TriangleAlertIcon className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-medium">
                      {informacao_validacao ??
                        (() => {
                          const vazios = campos.filter(
                            (c) => !c.valor.trim()
                          ).length;
                          return vazios > 0
                            ? `${vazios} campo(s) vazio(s). Revise no formulário de revisão ou complete manualmente.`
                            : 'Todos os campos foram extraídos. Você pode validar aqui ou continuar para revisão.';
                        })()}
                    </p>
                    <p className="mt-1 text-xs opacity-90">
                      Os dados podem ser validados no scroll-area acima ou no
                      formulário completo.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <ScrollArea className="h-48 rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium">Campo</th>
                      <th className="px-3 py-2 text-left font-medium">Valor</th>
                      <th className="w-20 px-3 py-2 text-center font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {campos.map(({ chave, valor }) => {
                      const preenchido = valor.trim().length > 0;
                      const rotulo = ROTULOS_CAMPOS[chave] ?? chave;
                      return (
                        <tr
                          key={chave}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-3 py-2 text-muted-foreground">
                            {rotulo}
                          </td>
                          <td className="max-w-[200px] truncate px-3 py-2">
                            {preenchido ? valor : '—'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {preenchido ? (
                              <CheckCircle2Icon className="mx-auto size-4 text-green-500" />
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                vazio
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          )}
        </div>

        {pode_fechar && (
          <DialogFooter>
            {passo === 'concluido' && (
              <div className="flex w-full gap-2">
                {onGerarPdf && (
                  <Button variant="outline" onClick={onGerarPdf}>
                    Gerar PDF
                  </Button>
                )}
                {onContinuar && (
                  <Button onClick={onContinuar}>Continuar para revisão</Button>
                )}
              </div>
            )}
            <Button variant="outline" onClick={onFechar}>
              Fechar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

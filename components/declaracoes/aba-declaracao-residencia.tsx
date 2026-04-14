'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field';
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CopyIcon,
  LoaderIcon,
  XCircleIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { Alert } from '../ui/alert';
import { CabecalhoEtapasDeclaracao } from './shared/cabecalho-etapas';
import { BlocoSucessoPDF } from './shared/sucesso-pdf';
import { cn } from '@/lib/utils';

const ESTRUTURA_PADRAO_MENSAGEM = [
  'Nome:',
  'Documento de Identidade:',
  'Órgão expedidor:',
  'CPF:',
  'Nacionalidade:',
  'Telefone:',
  'E-mail:',
  'Naturalidade:',
  'Endereço:',
  'Bairro:',
  'Cidade:',
  'CEP:',
  'UF:',
  'Complemento:',
].join('\n');

type CamposResidencia = {
  nome: string;
  documento_identidade: string;
  orgao_expedidor: string;
  cpf: string;
  nacionalidade: string;
  telefone: string;
  email: string;
  naturalidade: string;
  endereco: string;
  bairro: string;
  cidade: string;
  cep: string;
  uf: string;
  complemento: string;
};

const estado_inicial_campos: CamposResidencia = {
  nome: '',
  documento_identidade: '',
  orgao_expedidor: '',
  cpf: '',
  nacionalidade: '',
  telefone: '',
  email: '',
  naturalidade: '',
  endereco: '',
  bairro: '',
  cidade: '',
  cep: '',
  uf: '',
  complemento: '',
};

const mapa_rotulos_para_campo: Record<string, keyof CamposResidencia> = {
  nome: 'nome',
  'documento de identidade': 'documento_identidade',
  'orgão expedidor': 'orgao_expedidor',
  'órgão expedidor': 'orgao_expedidor',
  cpf: 'cpf',
  nacionalidade: 'nacionalidade',
  telefone: 'telefone',
  'e-mail': 'email',
  email: 'email',
  naturalidade: 'naturalidade',
  endereço: 'endereco',
  endereco: 'endereco',
  bairro: 'bairro',
  cidade: 'cidade',
  cep: 'cep',
  uf: 'uf',
  complemento: 'complemento',
};

type RespostaExtracaoIA = {
  campos: CamposResidencia;
  mensagem?: string;
  detalhe?: string;
};

type EtapaFluxoIA =
  | 'idle'
  | 'enviando'
  | 'extraindo'
  | 'normalizando'
  | 'concluido'
  | 'erro';

type StatusPasso = 'pendente' | 'andamento' | 'sucesso' | 'erro';

const CAMPOS_ROTULOS: Array<{ chave: keyof CamposResidencia; rotulo: string }> =
  [
    { chave: 'nome', rotulo: 'Nome' },
    { chave: 'documento_identidade', rotulo: 'Documento de identidade' },
    { chave: 'orgao_expedidor', rotulo: 'Órgão expedidor' },
    { chave: 'cpf', rotulo: 'CPF' },
    { chave: 'nacionalidade', rotulo: 'Nacionalidade' },
    { chave: 'telefone', rotulo: 'Telefone' },
    { chave: 'email', rotulo: 'E-mail' },
    { chave: 'naturalidade', rotulo: 'Naturalidade' },
    { chave: 'endereco', rotulo: 'Endereço' },
    { chave: 'bairro', rotulo: 'Bairro' },
    { chave: 'cidade', rotulo: 'Cidade' },
    { chave: 'cep', rotulo: 'CEP' },
    { chave: 'uf', rotulo: 'UF' },
    { chave: 'complemento', rotulo: 'Complemento' },
  ];

export default function AbaDeclaracaoResidencia() {
  const [mensagem_bruta, definir_mensagem_bruta] = useState('');
  const [campos, definir_campos] = useState<CamposResidencia>(
    estado_inicial_campos
  );
  const [etapa, definir_etapa] = useState<'entrada' | 'dados' | 'sucesso'>(
    'entrada'
  );
  const [gerando_pdf, definir_gerando_pdf] = useState(false);
  const [processando_mensagem, definir_processando_mensagem] = useState(false);
  const [motor_ia_ativo, definir_motor_ia_ativo] = useState(true);
  const [modal_fluxo_aberto, definir_modal_fluxo_aberto] = useState(false);
  const [etapa_fluxo_ia, definir_etapa_fluxo_ia] =
    useState<EtapaFluxoIA>('idle');
  const [campos_extraidos_modal, definir_campos_extraidos_modal] =
    useState<CamposResidencia | null>(null);
  const [erro_mensagem, definir_erro_mensagem] = useState<string | null>(null);
  const [erro_pdf, definir_erro_pdf] = useState<string | null>(null);
  const [copiado, definir_copiado] = useState(false);

  function normalizar_rotulo(rotulo: string) {
    return rotulo.trim().toLowerCase();
  }

  function extrair_dados_modo_manual(mensagem: string) {
    const linhas = mensagem.split('\n');
    const novo_estado: CamposResidencia = { ...estado_inicial_campos };

    for (const linha of linhas) {
      const partes = linha.split(':');
      if (partes.length < 2) continue;

      const rotulo = normalizar_rotulo(partes[0]);
      const valor = partes.slice(1).join(':').trim();
      const chave = mapa_rotulos_para_campo[rotulo];

      if (chave) {
        novo_estado[chave] = valor;
      }
    }

    return novo_estado;
  }

  async function processar_mensagem() {
    if (!mensagem_bruta.trim()) {
      definir_erro_mensagem(
        'Informe a mensagem completa da declaração antes de processar os dados.'
      );
      return;
    }

    try {
      definir_processando_mensagem(true);
      definir_erro_mensagem(null);

      if (!motor_ia_ativo) {
        const campos_manuais = extrair_dados_modo_manual(mensagem_bruta);
        definir_campos(campos_manuais);
        definir_etapa('dados');
        return;
      }

      definir_modal_fluxo_aberto(true);
      definir_etapa_fluxo_ia('enviando');
      definir_campos_extraidos_modal(null);

      const resposta = await fetch('/api/extrair-dados-declaracao-residencia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mensagem: mensagem_bruta }),
      });
      definir_etapa_fluxo_ia('extraindo');

      const corpo = (await resposta.json()) as RespostaExtracaoIA;

      if (!resposta.ok || !corpo.campos) {
        definir_etapa_fluxo_ia('erro');
        definir_erro_mensagem(
          corpo.mensagem ??
            'Não foi possível processar a mensagem com IA. Tente novamente.'
        );
        return;
      }

      definir_etapa_fluxo_ia('normalizando');
      definir_campos_extraidos_modal(corpo.campos);
      definir_etapa_fluxo_ia('concluido');
    } catch (erro) {
      console.error('Erro ao processar mensagem com IA:', erro);
      definir_etapa_fluxo_ia('erro');
      definir_erro_mensagem(
        'Falha ao processar a mensagem com IA. Tente novamente em instantes.'
      );
    } finally {
      definir_processando_mensagem(false);
    }
  }

  function finalizar_fluxo_ia() {
    if (!campos_extraidos_modal) return;

    definir_campos(campos_extraidos_modal);
    definir_modal_fluxo_aberto(false);
    definir_etapa_fluxo_ia('idle');
    definir_etapa('dados');
  }

  function obter_status_passo(passo: 1 | 2 | 3 | 4): StatusPasso {
    if (etapa_fluxo_ia === 'concluido') return 'sucesso';
    if (etapa_fluxo_ia === 'erro') {
      if (passo === 1) return 'sucesso';
      if (passo === 2) return 'erro';
      return 'pendente';
    }
    if (etapa_fluxo_ia === 'normalizando') {
      if (passo <= 2) return 'sucesso';
      if (passo === 3) return 'andamento';
      return 'pendente';
    }
    if (etapa_fluxo_ia === 'extraindo') {
      if (passo === 1) return 'sucesso';
      if (passo === 2) return 'andamento';
      return 'pendente';
    }
    if (etapa_fluxo_ia === 'enviando') {
      if (passo === 1) return 'andamento';
      return 'pendente';
    }
    return 'pendente';
  }

  function atualizar_campo(campo: keyof CamposResidencia, valor: string) {
    definir_campos((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function gerar_pdf() {
    try {
      definir_gerando_pdf(true);
      definir_erro_pdf(null);

      const resposta = await fetch('/api/declaracao-residencia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campos),
      });

      if (!resposta.ok) {
        definir_erro_pdf(
          'Não foi possível gerar o PDF da declaração. Tente novamente.'
        );
        return;
      }

      const content_disposition = resposta.headers.get('Content-Disposition');

      let nome_arquivo = 'declaracao-residencia.pdf';

      if (content_disposition) {
        const correspondencia = /filename="?([^"]+)"?/i.exec(
          content_disposition
        );
        if (correspondencia?.[1]) {
          nome_arquivo = correspondencia[1];
        }
      }

      const blob = await resposta.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = nome_arquivo;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      definir_etapa('sucesso');
    } catch (erro) {
      console.error('Erro ao gerar PDF de declaração de residência:', erro);
      definir_erro_pdf(
        'Ocorreu um erro inesperado ao gerar o PDF. Tente novamente em instantes.'
      );
    } finally {
      definir_gerando_pdf(false);
    }
  }

  const etapa_atual = etapa === 'entrada' ? 1 : etapa === 'dados' ? 2 : 3;

  useEffect(() => {
    if (etapa !== 'sucesso') return;

    const id = window.setTimeout(() => {
      definir_etapa('entrada');
    }, 500000);

    return () => window.clearTimeout(id);
  }, [etapa]);

  return (
    <section className="mt-2 space-y-6 rounded-4xl border border-dashed border-border bg-background/50 p-4 md:p-6">
      <CabecalhoEtapasDeclaracao
        etapas={['Mensagem da declaração', 'Dados identificados', 'PDF gerado']}
        etapa_atual={etapa_atual}
      />

      {etapa === 'entrada' && (
        <FieldSet className="gap-5">
          <FieldDescription>
            Cole a mensagem no formato esperado e clique em &quot;Processar
            dados&quot; para avançar para a próxima etapa.
          </FieldDescription>

          <FieldGroup className="gap-5">
            <Field>
              <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    Motor de IA (Gemini)
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {motor_ia_ativo
                      ? 'Ativo: leitura e formatação automática inteligente.'
                      : 'Desativado: leitura pelo parser local com base em rótulos.'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={motor_ia_ativo}
                    onClick={() => definir_motor_ia_ativo((valor) => !valor)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full border transition-colors',
                      motor_ia_ativo
                        ? 'border-primary bg-primary'
                        : 'border-border bg-muted'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block size-4 rounded-full bg-background transition-transform',
                        motor_ia_ativo ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="mensagem-residencia">
                Mensagem da declaração
              </FieldLabel>
              <Textarea
                id="mensagem-residencia"
                placeholder={ESTRUTURA_PADRAO_MENSAGEM}
                value={mensagem_bruta}
                onChange={(evento) =>
                  definir_mensagem_bruta(evento.target.value)
                }
                className="min-h-[260px] max-h-[45vh] overflow-y-auto"
              />
            </Field>

            <Field className="sticky bottom-3 z-10 rounded-xl border border-border bg-background/95 p-3 backdrop-blur-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        ESTRUTURA_PADRAO_MENSAGEM
                      );
                      definir_erro_mensagem(null);
                      definir_copiado(true);
                      setTimeout(() => {
                        definir_copiado(false);
                      }, 3000);
                    } catch {
                      definir_erro_mensagem(
                        'Não foi possível copiar a estrutura para a área de transferência.'
                      );
                      definir_copiado(false);
                    }
                  }}
                >
                  {copiado ? (
                    <CheckCircle2Icon className="size-4 text-green-500" />
                  ) : (
                    <CopyIcon className="size-4" />
                  )}
                  {copiado ? (
                    <span className="text-green-500">Estrutura copiada</span>
                  ) : (
                    'Copiar estrutura esperada'
                  )}
                </Button>

                <Button
                  size="lg"
                  type="button"
                  onClick={processar_mensagem}
                  disabled={processando_mensagem}
                  className="w-full sm:w-auto"
                >
                  {processando_mensagem
                    ? motor_ia_ativo
                      ? 'Processando com IA...'
                      : 'Processando...'
                    : motor_ia_ativo
                      ? 'Processar dados com IA'
                      : 'Processar dados sem IA'}
                </Button>
              </div>

              {erro_mensagem ? (
                <Alert
                  variant="destructive"
                  className="mt-4 border-red-500/20 bg-red-500/5 font-bold"
                >
                  <TriangleAlertIcon className="size-4" />
                  {erro_mensagem}
                </Alert>
              ) : null}
            </Field>
          </FieldGroup>
        </FieldSet>
      )}

      {etapa === 'dados' && (
        <FieldSet className="gap-5">
          <FieldDescription>
            Revise e ajuste os dados extraídos da mensagem antes de gerar a
            declaração.
          </FieldDescription>

          <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field className="sm:col-span-2 lg:col-span-2">
              <FieldLabel htmlFor="campo-nome">Nome</FieldLabel>
              <Input
                id="campo-nome"
                value={campos.nome}
                onChange={(evento) =>
                  atualizar_campo('nome', evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-documento-identidade">
                Documento de Identidade
              </FieldLabel>
              <Input
                id="campo-documento-identidade"
                value={campos.documento_identidade}
                onChange={(evento) =>
                  atualizar_campo('documento_identidade', evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-orgao-expedidor">
                Órgão expedidor
              </FieldLabel>
              <Input
                id="campo-orgao-expedidor"
                value={campos.orgao_expedidor}
                onChange={(evento) =>
                  atualizar_campo('orgao_expedidor', evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-cpf">CPF</FieldLabel>
              <Input
                id="campo-cpf"
                value={campos.cpf}
                onChange={(evento) =>
                  atualizar_campo('cpf', evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-nacionalidade">
                Nacionalidade
              </FieldLabel>
              <Input
                id="campo-nacionalidade"
                value={campos.nacionalidade}
                onChange={(evento) =>
                  atualizar_campo('nacionalidade', evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-telefone">Telefone</FieldLabel>
              <Input
                id="campo-telefone"
                value={campos.telefone}
                onChange={(evento) =>
                  atualizar_campo('telefone', evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-email">E-mail</FieldLabel>
              <Input
                id="campo-email"
                value={campos.email}
                onChange={(evento) =>
                  atualizar_campo('email', evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-naturalidade">Naturalidade</FieldLabel>
              <Input
                id="campo-naturalidade"
                value={campos.naturalidade}
                onChange={(evento) =>
                  atualizar_campo('naturalidade', evento.target.value)
                }
              />
            </Field>

            <Field className="sm:col-span-2 lg:col-span-3">
              <FieldLabel htmlFor="campo-endereco">Endereço</FieldLabel>
              <Input
                id="campo-endereco"
                value={campos.endereco}
                onChange={(evento) =>
                  atualizar_campo('endereco', evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-bairro">Bairro</FieldLabel>
              <Input
                id="campo-bairro"
                value={campos.bairro}
                onChange={(evento) =>
                  atualizar_campo('bairro', evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-cidade">Cidade</FieldLabel>
              <Input
                id="campo-cidade"
                value={campos.cidade}
                onChange={(evento) =>
                  atualizar_campo('cidade', evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-cep">CEP</FieldLabel>
              <Input
                id="campo-cep"
                value={campos.cep}
                onChange={(evento) =>
                  atualizar_campo('cep', evento.target.value)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="campo-uf">UF</FieldLabel>
              <Input
                id="campo-uf"
                value={campos.uf}
                onChange={(evento) =>
                  atualizar_campo('uf', evento.target.value)
                }
              />
            </Field>

            <Field className="sm:col-span-2 lg:col-span-2">
              <FieldLabel htmlFor="campo-complemento">Complemento</FieldLabel>
              <Input
                id="campo-complemento"
                value={campos.complemento}
                onChange={(evento) =>
                  atualizar_campo('complemento', evento.target.value)
                }
              />
            </Field>

            <Field
              orientation="horizontal"
              className="sm:col-span-2 lg:col-span-3 flex items-center justify-between gap-2 pt-6"
            >
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => definir_etapa('entrada')}
                className="w-full sm:w-auto"
              >
                <ArrowLeftIcon className="size-4" />
                Voltar para a etapa anterior
              </Button>

              <Button
                type="button"
                variant="default"
                size="lg"
                onClick={gerar_pdf}
                disabled={gerando_pdf}
                className="w-full sm:w-auto"
              >
                {gerando_pdf ? 'Gerando PDF...' : 'Gerar PDF'}
              </Button>
            </Field>

            {erro_pdf ? (
              <Field className="sm:col-span-2 lg:col-span-3">
                <Alert
                  variant="destructive"
                  className="border-red-500/20 bg-red-500/5 font-bold"
                >
                  <TriangleAlertIcon className="size-4" />
                  {erro_pdf}
                </Alert>
              </Field>
            ) : null}
          </FieldGroup>
        </FieldSet>
      )}

      {etapa === 'sucesso' && (
        <BlocoSucessoPDF
          on_concluir={() => definir_etapa('entrada')}
          descricao="O download da declaração foi iniciado. Você será levado de volta para a etapa 1 automaticamente em alguns segundos."
          rotulo_botao="Concluir"
        />
      )}

      {modal_fluxo_aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-background p-5 shadow-lg">
            <div className="mb-3">
              <h3 className="text-lg font-semibold">Fluxo de trabalho da IA</h3>
              <p className="text-sm text-muted-foreground">
                Processamento inteligente com Gemini e fallback automático de
                modelo.
              </p>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              {[
                {
                  numero: 1 as const,
                  titulo: 'Recebimento',
                  descricao: 'Mensagem enviada para análise.',
                },
                {
                  numero: 2 as const,
                  titulo: 'Leitura semântica',
                  descricao: 'Gemini interpreta e extrai os campos.',
                },
                {
                  numero: 3 as const,
                  titulo: 'Normalização',
                  descricao: 'Padronização de CPF, telefone, CEP e UF.',
                },
                {
                  numero: 4 as const,
                  titulo: 'Validação final',
                  descricao: 'Preparo para abrir a próxima etapa.',
                },
              ].map((passo) => {
                const status = obter_status_passo(passo.numero);

                return (
                  <div
                    key={passo.numero}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-3',
                      status === 'sucesso' &&
                        'border-green-500/40 bg-green-500/10',
                      status === 'andamento' &&
                        'border-blue-500/40 bg-blue-500/10',
                      status === 'erro' && 'border-red-500/40 bg-red-500/10',
                      status === 'pendente' && 'border-border bg-card'
                    )}
                  >
                    <div className="mt-0.5">
                      {status === 'sucesso' ? (
                        <CheckCircle2Icon className="text-green-600" />
                      ) : status === 'erro' ? (
                        <XCircleIcon className="text-red-600" />
                      ) : status === 'andamento' ? (
                        <LoaderIcon className="animate-spin text-blue-600" />
                      ) : (
                        <span className="flex size-5 items-center justify-center rounded-full border border-border text-[10px] text-muted-foreground">
                          {passo.numero}
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="font-medium">{passo.titulo}</p>
                      <p className="text-muted-foreground">{passo.descricao}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {campos_extraidos_modal && (
              <div className="mt-4 rounded-xl border border-border bg-card p-3">
                <p className="mb-2 text-sm font-medium">
                  Status da extração por campo
                </p>
                <div className="grid gap-2 text-xs sm:grid-cols-2">
                  {CAMPOS_ROTULOS.map(({ chave, rotulo }) => {
                    const extraido = Boolean(
                      campos_extraidos_modal[chave]?.trim()
                    );

                    return (
                      <div
                        key={chave}
                        className="flex items-center justify-between rounded-md border border-border/70 p-2"
                      >
                        <p className="font-medium text-foreground">{rotulo}</p>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-medium',
                            extraido
                              ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                              : 'bg-red-500/15 text-red-700 dark:text-red-400'
                          )}
                        >
                          {extraido ? 'Extraído' : 'Não extraído'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {etapa_fluxo_ia === 'erro' && (
              <Alert
                variant="destructive"
                className="mt-4 border-red-500/30 bg-red-500/10"
              >
                <TriangleAlertIcon />
                Não foi possível concluir a leitura da IA nesta tentativa.
              </Alert>
            )}

            <div className="mt-4 flex justify-end gap-2">
              {etapa_fluxo_ia === 'concluido' ? (
                <Button type="button" onClick={finalizar_fluxo_ia}>
                  Avançar para revisão
                </Button>
              ) : etapa_fluxo_ia === 'erro' ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      definir_modal_fluxo_aberto(false);
                      definir_etapa_fluxo_ia('idle');
                    }}
                  >
                    Fechar
                  </Button>
                  <Button type="button" onClick={processar_mensagem}>
                    Tentar novamente
                  </Button>
                </>
              ) : (
                <Button type="button" variant="outline" disabled>
                  <LoaderIcon
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                  Processando...
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

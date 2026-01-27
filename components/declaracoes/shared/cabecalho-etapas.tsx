"use client";

import { FieldSet } from "@/components/ui/field";

type PropsCabecalhoEtapas = {
  etapas: string[];
  etapa_atual: number;
};

export function CabecalhoEtapasDeclaracao({
  etapas,
  etapa_atual,
}: PropsCabecalhoEtapas) {
  return (
    <FieldSet className="border-none p-0">
      <div className="flex items-center gap-4">
        {etapas.map((etiqueta, indice) => {
          const numero = indice + 1;
          const ativo = etapa_atual >= numero;
          const mostrar_linha = indice < etapas.length - 1;

          return (
            <div key={etiqueta} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    ativo
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {numero}
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {etiqueta}
                </span>
              </div>

              {mostrar_linha && (
                <div
                  className={`h-px flex-1 transition-colors ${
                    etapa_atual > numero ? "bg-white" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </FieldSet>
  );
}


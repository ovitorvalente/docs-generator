import Header from "@/components/system/header";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import AbaDeclaracaoResidencia from "@/components/declaracoes/aba-declaracao-residencia";
import AbaDeclaracaoResidenciaResponsabilidade from "@/components/declaracoes/aba-declaracao-residencia-responsabilidade";

export default function PaginaInicial() {
  return (
    <main className="flex min-h-screen w-full flex-col">
      <Header />

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 md:px-6 md:py-8">
        <Tabs defaultValue="residencia" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 md:grid-cols-2">
            <TabsTrigger
              value="residencia"
              className="h-auto min-h-11 justify-start whitespace-normal border border-border px-4 py-3 text-left leading-5 data-[state=active]:border-primary/30"
            >
              Declaração de Residência
            </TabsTrigger>
            <TabsTrigger
              value="residencia_responsabilidade"
              className="h-auto min-h-11 justify-start whitespace-normal border border-border px-4 py-3 text-left leading-5 data-[state=active]:border-primary/30"
            >
              Declaração de Residência e Responsabilidade Financeira
            </TabsTrigger>
          </TabsList>

          <TabsContent value="residencia">
            <AbaDeclaracaoResidencia />
          </TabsContent>

          <TabsContent value="residencia_responsabilidade">
            <AbaDeclaracaoResidenciaResponsabilidade />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}

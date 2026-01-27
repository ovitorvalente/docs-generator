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

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6">
        <Tabs defaultValue="residencia" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="residencia">
              Declaração de Residência
            </TabsTrigger>
            <TabsTrigger value="residencia_responsabilidade">
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

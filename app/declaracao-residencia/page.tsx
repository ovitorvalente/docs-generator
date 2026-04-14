import Header from "@/components/system/header";
import AbaDeclaracaoResidencia from "@/components/declaracoes/aba-declaracao-residencia";

export default function PaginaDeclaracaoResidencia() {
  return (
    <main className="flex min-h-screen w-full flex-col">
      <Header />

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 md:px-6 md:py-8">
        <AbaDeclaracaoResidencia />
      </section>
    </main>
  );
}

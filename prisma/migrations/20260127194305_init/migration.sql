-- CreateTable
CREATE TABLE "logs_documentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "dados" TEXT NOT NULL DEFAULT '{}',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "logs_documentos_tipo_idx" ON "logs_documentos"("tipo");

-- CreateIndex
CREATE INDEX "logs_documentos_criadoEm_idx" ON "logs_documentos"("criadoEm");

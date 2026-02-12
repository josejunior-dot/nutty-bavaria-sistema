-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "cobertura_dias" INTEGER,
ADD COLUMN     "fornecedor_padrao_id" TEXT,
ADD COLUMN     "lead_time_dias" INTEGER,
ADD COLUMN     "lote_minimo" INTEGER;

-- CreateTable
CREATE TABLE "eventos_sazonais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3) NOT NULL,
    "multiplicador" DECIMAL(4,2) NOT NULL,
    "recorrente" BOOLEAN NOT NULL DEFAULT false,
    "empresa_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_sazonais_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_fornecedor_padrao_id_fkey" FOREIGN KEY ("fornecedor_padrao_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_sazonais" ADD CONSTRAINT "eventos_sazonais_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

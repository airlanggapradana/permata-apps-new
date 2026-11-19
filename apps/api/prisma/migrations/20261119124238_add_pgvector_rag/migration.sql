-- Enable pgvector extension for embedding storage and similarity search.
CREATE EXTENSION IF NOT EXISTS vector;

-- Curated knowledge chunks for web chat RAG (global/non-personal content only).
CREATE TABLE "knowledge_chunks" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "embedding" vector(768) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- Idempotent upsert key used by pnpm rag:index.
CREATE UNIQUE INDEX "knowledge_chunks_source_chunk_index_key"
    ON "knowledge_chunks"("source", "chunk_index");

CREATE INDEX "knowledge_chunks_source_idx" ON "knowledge_chunks"("source");

-- Cosine-distance ANN index for retrieval queries.
CREATE INDEX "knowledge_chunks_embedding_hnsw_idx"
    ON "knowledge_chunks"
    USING hnsw ("embedding" vector_cosine_ops);

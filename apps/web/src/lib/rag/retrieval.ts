import { getDb } from "@/lib/db";
import { embedText, getRagEmbeddingDim, toPgVectorLiteral } from "./embeddings";

export interface RagChunk {
  content: string;
  source: string;
  metadata: Record<string, unknown>;
  score: number;
}

const DEFAULT_TOP_K = 4;
const MAX_TOP_K = 8;

function getTopK(): number {
  const raw = process.env.RAG_TOP_K?.trim();
  if (!raw) return DEFAULT_TOP_K;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return DEFAULT_TOP_K;
  return Math.min(parsed, MAX_TOP_K);
}

function isMissingKnowledgeTableError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  if (code === "42P01" || code === "42704") return true;
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return /knowledge_chunks|vector/i.test(message) && /does not exist|undefined/i.test(message);
}

export async function retrieveRelevantChunks(
  query: string,
  topK?: number,
): Promise<RagChunk[]> {
  const text = query.trim();
  if (!text) return [];

  try {
    const vector = await embedText(text, "RETRIEVAL_QUERY");
    if (!vector) return [];

    const dim = getRagEmbeddingDim();
    if (vector.length !== dim) return [];

    const db = getDb();
    const k = Math.max(1, Math.min(topK ?? getTopK(), MAX_TOP_K));
    const vectorLiteral = toPgVectorLiteral(vector);

    const rows = await db<RagChunk & { metadata: unknown }>`
      SELECT
        content,
        source,
        metadata,
        1 - (embedding <=> ${vectorLiteral}::vector) AS score
      FROM knowledge_chunks
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${k}
    `;

    return rows
      .filter((row) => typeof row?.content === "string" && row.content.trim())
      .map((row) => ({
        content: row.content.trim(),
        source: typeof row.source === "string" ? row.source : "docs/rag/unknown",
        metadata:
          row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
            ? (row.metadata as Record<string, unknown>)
            : {},
        score:
          typeof row.score === "number" && Number.isFinite(row.score)
            ? row.score
            : Number(row.score) || 0,
      }));
  } catch (error) {
    if (!isMissingKnowledgeTableError(error)) {
      console.warn("[rag] retrieval skipped:", error);
    }
    return [];
  }
}

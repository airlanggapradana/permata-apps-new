import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";

export type TaggedSqlFunction = <T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
) => Promise<T[]>;

let activeSql: TaggedSqlFunction | null = null;
let pgPool: Pool | null = null;

function createPgTaggedSql(pool: Pool): TaggedSqlFunction {
  return async function sql<T = any>(
    strings: TemplateStringsArray,
    ...values: any[]
  ): Promise<T[]> {
    let text = strings[0];
    for (let i = 0; i < values.length; i++) {
      text += `$${i + 1}` + strings[i + 1];
    }
    const res = await pool.query(text, values);
    return res.rows as T[];
  };
}

export function getDb(): TaggedSqlFunction {
  if (activeSql) return activeSql;

  const databaseUrl =
    process.env.DATABASE_URL ||
    "postgresql://postgres:admin123@localhost:5432/permata";

  const isLocal =
    databaseUrl.includes("localhost") ||
    databaseUrl.includes("127.0.0.1") ||
    databaseUrl.includes("0.0.0.0");

  const isNeon = databaseUrl.includes("neon.tech");

  if (isNeon) {
    const neonClient = neon(databaseUrl) as unknown as TaggedSqlFunction;
    activeSql = neonClient;
    return activeSql;
  }

  if (!pgPool) {
    pgPool = new Pool({
      connectionString: databaseUrl,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }

  activeSql = createPgTaggedSql(pgPool);
  return activeSql;
}

export function getPgPool(): Pool {
  const databaseUrl =
    process.env.DATABASE_URL ||
    "postgresql://postgres:admin123@localhost:5432/permata";

  const isLocal =
    databaseUrl.includes("localhost") ||
    databaseUrl.includes("127.0.0.1") ||
    databaseUrl.includes("0.0.0.0");

  if (!pgPool) {
    pgPool = new Pool({
      connectionString: databaseUrl,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pgPool;
}

import "server-only";
import { readFileSync } from "node:fs";
import mysql, { type Pool, type PoolConnection, type RowDataPacket } from "mysql2/promise";

let pool: Pool | undefined;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`MySQL is not configured: set ${name}`);
  return value;
}

export function getMysqlPool(): Pool {
  if (!pool) {
    const port = Number(process.env.MYSQL_PORT ?? 3306);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error("MYSQL_PORT must be a valid TCP port");
    }
    pool = mysql.createPool({
      host: required("MYSQL_HOST"),
      port,
      user: required("MYSQL_USER"),
      password: required("MYSQL_PASSWORD"),
      database: required("MYSQL_DATABASE"),
      charset: "utf8mb4",
      connectionLimit: 5,
      waitForConnections: true,
      queueLimit: 50,
      connectTimeout: 10000,
      decimalNumbers: true,
      ssl: process.env.MYSQL_SSL_CA
        ? { ca: readFileSync(process.env.MYSQL_SSL_CA, "utf8"), rejectUnauthorized: true, verifyIdentity: true }
        : undefined,
    });
  }
  return pool;
}

type SqlValue = string | number | boolean | null;

export async function mysqlRows<T>(
  sql: string,
  values: SqlValue[] = [],
  connection: Pool | PoolConnection = getMysqlPool(),
): Promise<T[]> {
  const [rows] = await connection.execute<(T & RowDataPacket)[]>(sql, values);
  return rows;
}

export async function mysqlTransaction<T>(
  run: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await getMysqlPool().getConnection();
  try {
    await connection.query("SET SESSION sql_mode = 'STRICT_ALL_TABLES,NO_ENGINE_SUBSTITUTION'");
    await connection.beginTransaction();
    const result = await run(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

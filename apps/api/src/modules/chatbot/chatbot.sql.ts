import { pool } from '../../config/database';
import { AppError } from '../../common/errors/AppError';
import { DatabaseSqlPlan, SemanticTable } from './chatbot.types';

const DANGEROUS_SQL = /\b(insert|update|delete|drop|alter|truncate|create|replace|merge|grant|revoke|call|load|outfile|dumpfile)\b/i;
const COMMENT_SQL = /(--|#|\/\*)/;
const PERSONAL_TABLES = new Set(['alumno', 'inscripcion', 'historial_academico', 'calificacion']);

export interface ValidatedSql {
  sql: string;
  params: unknown[];
  tables: string[];
  columns: string[];
}

export function validateAndPrepareSqlPlan(
  plan: DatabaseSqlPlan,
  catalog: SemanticTable[],
  authContext: { idUsuario: number; roles: string[] }
): ValidatedSql {
  const sql = normalizeSql(plan.sql);
  if (!sql.toLowerCase().startsWith('select ')) {
    throw new AppError('Solo se permiten consultas SELECT en el agente de base de datos', 400);
  }
  if (DANGEROUS_SQL.test(sql) || COMMENT_SQL.test(sql) || sql.includes(';')) {
    throw new AppError('La consulta SQL generada contiene instrucciones no permitidas', 400);
  }

  const allowedTables = new Map(catalog.map((table) => [table.table, table]));
  const tables = unique([...extractTables(sql), ...(plan.tables ?? []).map(normalizeIdentifier)]);
  if (!tables.length) throw new AppError('La consulta SQL no declara tablas permitidas', 400);

  for (const table of tables) {
    if (!allowedTables.has(table)) {
      throw new AppError(`Tabla no permitida para el chatbot: ${table}`, 400);
    }
  }

  const columns = unique((plan.columns ?? []).map(normalizeColumn).filter(Boolean));
  if (!columns.length) {
    throw new AppError('La consulta SQL debe declarar las columnas que usara', 400);
  }

  for (const column of columns) {
    const [maybeTable, maybeColumn] = column.includes('.') ? column.split('.') : ['', column];
    if (maybeColumn === '*') continue;

    const candidateTables = maybeTable ? [maybeTable] : tables;
    const allowed = candidateTables.some((table) => {
      const semanticTable = allowedTables.get(table);
      return Boolean(semanticTable?.columns[maybeColumn]);
    });
    if (!allowed) {
      throw new AppError(`Columna no permitida para el chatbot: ${column}`, 400);
    }
  }

  if (authContext.roles.includes('alumno') && tables.some((table) => PERSONAL_TABLES.has(table))) {
    const lower = sql.toLowerCase();
    const hasAuthFilter =
      lower.includes('id_usuario') ||
      lower.includes(':authuserid') ||
      lower.includes(':auth_user_id') ||
      lower.includes('auth_user_id');
    if (!hasAuthFilter) {
      throw new AppError('Las consultas de alumno deben filtrar por el usuario autenticado', 400);
    }
  }

  const limitedSql = /\blimit\s+\d+/i.test(sql) ? sql : `${sql} LIMIT 100`;
  const prepared = replaceNamedParams(limitedSql, plan.params ?? {}, authContext);
  return { sql: prepared.sql, params: prepared.params, tables, columns };
}

export async function executeValidatedSql(validated: ValidatedSql): Promise<Record<string, unknown>[]> {
  const [rows] = await pool.execute(validated.sql, validated.params as any);
  return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
}

function replaceNamedParams(
  sql: string,
  rawParams: Record<string, unknown>,
  authContext: { idUsuario: number }
): { sql: string; params: unknown[] } {
  const params: unknown[] = [];
  const preparedSql = sql.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_match, key: string) => {
    const raw = rawParams[key] ?? rawParams[toSnakeCase(key)];
    params.push(resolveParamValue(raw, key, authContext));
    return '?';
  });

  return { sql: preparedSql, params };
}

function resolveParamValue(raw: unknown, key: string, authContext: { idUsuario: number }): unknown {
  if (
    raw === 'AUTH_USER_ID' ||
    raw === 'FROM_AUTH_CONTEXT' ||
    key === 'authUserId' ||
    key === 'auth_user_id'
  ) {
    return authContext.idUsuario;
  }
  return raw;
}

function extractTables(sql: string): string[] {
  const tables: string[] = [];
  const regex = /\b(?:from|join)\s+`?([a-zA-Z_][a-zA-Z0-9_]*)`?/gi;
  let match = regex.exec(sql);
  while (match) {
    tables.push(normalizeIdentifier(match[1]));
    match = regex.exec(sql);
  }
  return unique(tables);
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

function normalizeIdentifier(value: string): string {
  return value.replace(/[`"]/g, '').trim().toLowerCase();
}

function normalizeColumn(value: string): string {
  return value
    .replace(/[`"]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+as\s+.+$/i, '');
}

function toSnakeCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

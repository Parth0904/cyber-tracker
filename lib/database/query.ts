import db from "./connection";

export function one<T>(
  sql: string,
  ...params: unknown[]
): T | undefined {

  return db
    .prepare(sql)
    .get(...params) as T | undefined;

}

export function many<T>(
  sql: string,
  ...params: unknown[]
): T[] {

  return db
    .prepare(sql)
    .all(...params) as T[];

}

export function execute(
  sql: string,
  ...params: unknown[]
) {

  return db
    .prepare(sql)
    .run(...params);

}
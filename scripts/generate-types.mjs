import { PGlite } from '@electric-sql/pglite';
import { readFile, writeFile, readdir } from 'node:fs/promises';
const db = new PGlite();
await db.exec(
  `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create table auth.users(id uuid primary key);create function auth.uid()returns uuid language sql stable as $$select null::uuid$$;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid,bucket_id text);`,
);
for (const f of (await readdir('supabase/migrations')).filter((f) => f.endsWith('.sql')).sort())
  await db.exec(
    (await readFile('supabase/migrations/' + f, 'utf8')).replace(
      'create extension if not exists pgcrypto;',
      '',
    ),
  );
const { rows } = await db.query(
  `select table_name,column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public' order by table_name,ordinal_position`,
);
const tables = {};
for (const r of rows) (tables[r.table_name] ??= []).push(r);
let out =
  '// Generated from versioned migrations by scripts/generate-types.mjs. Do not edit.\nexport type Json = string | number | boolean | null | { [key:string]: Json | undefined } | Json[];\nexport type Database = { public: { Tables: {\n';
for (const [name, cols] of Object.entries(tables)) {
  const fields = cols.map((c) => {
    let type = ['bigint', 'integer', 'numeric', 'smallint', 'real', 'double precision'].includes(
      c.data_type,
    )
      ? 'number'
      : c.data_type === 'boolean'
        ? 'boolean'
        : c.data_type === 'jsonb'
          ? 'Json'
          : c.data_type === 'ARRAY'
            ? 'number[]'
            : 'string';
    if (c.is_nullable === 'YES') type += ' | null';
    return { ...c, type };
  });
  out +=
    JSON.stringify(name) +
    ': { Row: {\n' +
    fields.map((c) => `${JSON.stringify(c.column_name)}: ${c.type};`).join('\n') +
    '\n}; Insert: {\n' +
    fields
      .map(
        (c) =>
          `${JSON.stringify(c.column_name)}${c.column_default || c.is_nullable === 'YES' ? '?' : ''}: ${c.type};`,
      )
      .join('\n') +
    '\n}; Update: Partial<Database["public"]["Tables"][' +
    JSON.stringify(name) +
    ']["Insert"]>; Relationships: [] };\n';
}
out +=
  '} } };\nexport type Row<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];\n';
await writeFile('src/types/database.ts', out);
await db.close();
console.log('Generated database types from ' + Object.keys(tables).length + ' relations');

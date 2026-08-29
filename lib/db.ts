import postgres from'postgres';

let client:ReturnType<typeof postgres>|null=null;

export class DatabaseNotConfiguredError extends Error{
  constructor(){super('O banco de dados da CDP ainda não foi conectado na Vercel.');this.name='DatabaseNotConfiguredError'}
}

function connectionUrl(){return process.env.DATABASE_URL?.trim()||process.env.POSTGRES_URL?.trim()||process.env.NEON_DATABASE_URL?.trim()||''}

export function isDatabaseConfigured(){return Boolean(connectionUrl())}

export function db(){
  const connectionString=connectionUrl();
  if(!connectionString)throw new DatabaseNotConfiguredError();
  if(!client)client=postgres(connectionString,{max:1,prepare:false,idle_timeout:20,connect_timeout:10});
  return client;
}

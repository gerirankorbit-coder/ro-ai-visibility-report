import { handleLogin } from '../server/login.js';
import { readGateEnv } from '../server/session.js';
import { serverDb } from '../server/db.js';

export function POST(request: Request): Promise<Response> {
  return handleLogin(request, readGateEnv(process.env), serverDb(process.env));
}
export function GET(request: Request): Promise<Response> {
  return handleLogin(request, readGateEnv(process.env), null);
}

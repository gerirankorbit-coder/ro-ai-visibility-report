import { handleMedia } from '../server/media.js';
import { readGateEnv } from '../server/session.js';
import { serverDb } from '../server/db.js';

export function GET(request: Request): Promise<Response> {
  return handleMedia(request, readGateEnv(process.env), serverDb(process.env));
}

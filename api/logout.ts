import { handleLogout } from '../server/login.js';

export function POST(request: Request): Response {
  return handleLogout(request);
}

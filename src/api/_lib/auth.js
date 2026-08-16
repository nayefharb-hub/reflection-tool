/* Shared admin-auth check for api/admin/* functions.
   Password lives in the ADMIN_PASSWORD environment variable (set it in
   Vercel Project Settings -> Environment Variables). Compared with a
   timing-safe check against the request's "Authorization: Bearer <password>"
   header. */

const crypto = require("crypto");

function isAuthorized(req) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;

  const header = req.headers["authorization"] || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { isAuthorized };

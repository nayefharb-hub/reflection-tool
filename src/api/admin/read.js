/* Password-protected: returns one submission's raw text content. Fetches
   the blob server-side via the Blob read-write token, so the client never
   sees the underlying blob URL. access is "public" to match the connected
   Blob store's provisioned access mode — see submit.js for why this isn't
   a meaningful privacy weakening in practice. */

const { get } = require("@vercel/blob");
const { isAuthorized } = require("../_lib/auth");

async function streamToText(stream) {
  const reader = stream.getReader();
  const chunks = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
}

module.exports = async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
  res.setHeader("Cache-Control", "no-store");

  const path = req.query && req.query.path;
  if (typeof path !== "string" || !path.startsWith("submissions/") || path.includes("..")) {
    return res.status(400).json({ ok: false, error: "invalid_path" });
  }

  try {
    const result = await get(path, { access: "public" });
    if (!result) return res.status(404).json({ ok: false, error: "not_found" });

    const text = await streamToText(result.stream);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(text);
  } catch (err) {
    console.error("Failed to read submission:", err);
    res.status(500).json({ ok: false, error: "read_failed" });
  }
};

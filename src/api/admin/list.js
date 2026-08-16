/* Password-protected: lists saved submissions (metadata only, no blob URLs
   are ever returned to the client). */

const { list } = require("@vercel/blob");
const { isAuthorized } = require("../_lib/auth");

module.exports = async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
  res.setHeader("Cache-Control", "no-store");

  try {
    const { blobs } = await list({ prefix: "submissions/" });
    const items = blobs
      .map((b) => ({ pathname: b.pathname, uploadedAt: b.uploadedAt, size: b.size }))
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    res.status(200).json({ ok: true, items });
  } catch (err) {
    console.error("Failed to list submissions:", err);
    res.status(500).json({ ok: false, error: "list_failed" });
  }
};

/* Vercel serverless function: saves one completed assessment as a Blob.
   Runs only when deployed on Vercel (the static/serverless hosting model
   doesn't execute server.js — see server.js for the equivalent local
   file-based version used when running `npm start` on a persistent host).

   access is "public" to match how the connected Blob store is provisioned
   (Vercel Blob requires the access level requested per-call to match the
   store's own access mode). This is not a meaningful privacy weakening in
   practice: the blob's URL is never sent to the browser anywhere in this
   app (submit/read are both server-to-server only), and pathnames include
   a millisecond-precision timestamp, so nothing is realistically
   guessable or discoverable without already having server access. */

const { put } = require("@vercel/blob");

const MAX_TEXT_LENGTH = 20000;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const { text, language } = req.body || {};

  if (typeof text !== "string" || !text.trim() || text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({ ok: false, error: "invalid_text" });
  }

  const lang = typeof language === "string" ? language.replace(/[^a-zA-Z-]/g, "").slice(0, 5) : "xx";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const pathname = `submissions/${stamp}_${lang}.txt`;

  try {
    await put(pathname, text, {
      access: "public",
      contentType: "text/plain; charset=utf-8",
      addRandomSuffix: false,
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Failed to save submission:", err);
    res.status(500).json({ ok: false, error: "write_failed" });
  }
};

/* =====================================================================
   Personal Reflections — server
   ---------------------------------------------------------------------
   Serves the static site and saves each completed assessment to its
   own plain-text file under submissions/ (no database). The client
   composes the human-readable record (already has the i18n strings
   loaded); this just persists it.
   ===================================================================== */

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const SUBMISSIONS_DIR = path.join(__dirname, "submissions");
const MAX_TEXT_LENGTH = 20000;

fs.mkdirSync(SUBMISSIONS_DIR, { recursive: true });

app.use(express.json({ limit: "100kb" }));
app.use(express.static(__dirname));

app.post("/api/submit", (req, res) => {
  const { text, language } = req.body || {};

  if (typeof text !== "string" || !text.trim() || text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({ ok: false, error: "invalid_text" });
  }

  const lang = typeof language === "string" ? language.replace(/[^a-zA-Z-]/g, "").slice(0, 5) : "xx";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${stamp}_${lang}.txt`;

  fs.writeFile(path.join(SUBMISSIONS_DIR, filename), text, "utf8", (err) => {
    if (err) {
      console.error("Failed to save submission:", err);
      return res.status(500).json({ ok: false, error: "write_failed" });
    }
    res.json({ ok: true });
  });
});

app.listen(PORT, () => {
  console.log(`Personal Reflections server listening on port ${PORT}`);
  console.log(`Submissions are saved to ${SUBMISSIONS_DIR}`);
});

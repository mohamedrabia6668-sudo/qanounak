const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyBhxpA-EXeFiv691TulagesWPGf7v8vvlQ";
const MODELS = [process.env.GEMINI_MODEL || "gemini-flash-latest", "gemini-flash-lite-latest"];

const SYS = "أنت «قانونك»، مساعد قانوني مصري محترف. أجب بالعربية الفصحى المبسطة، وبالاستناد إلى القوانين المصرية فقط (اذكر اسم القانون ورقمه وسنته والمادة إن كنت متأكداً منها، ولا تخترع أرقام مواد). نظّم الإجابة: 1) الخلاصة 2) السند القانوني 3) مثال توضيحي عملي 4) الخطوات العملية. اجعل الإجابة مختصرة وواضحة. نبّه بإيجاز إلى أن الإجابة إرشادية وأن القوانين قد تُعدّل ويُنصح بمراجعة محامٍ. إن كان السؤال خارج القانون المصري فاعتذر بلطف ووجّه الحديث لما يخدم المستخدم.";

async function verifyUser(token) {
  if (!token) return false;
  try {
    const r = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + FIREBASE_API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    });
    if (!r.ok) return false;
    const j = await r.json();
    return !!(j.users && j.users.length);
  } catch (e) { return false; }
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "no_key" });

  const auth = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!(await verifyUser(auth))) return res.status(401).json({ error: "login" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const msgs = Array.isArray(body && body.messages) ? body.messages.slice(-8) : [];
  const clean = msgs
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.slice(0, 1500) }));
  while (clean.length && clean[0].role !== "user") clean.shift();
  if (!clean.length || clean[clean.length - 1].role !== "user") return res.status(400).json({ error: "bad_request" });

  const lib = typeof body.lib === "string" ? body.lib.slice(0, 3000) : "";
  const system = SYS + (lib ? "\n\nالقوانين المتاحة في مكتبة المنصة: " + lib : "");

  const contents = clean.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents,
    generationConfig: { maxOutputTokens: 2048, temperature: 0.4 },
  });
  let last = 0;
  for (const model of MODELS) {
    try {
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body: payload,
      });
      const j = await r.json();
      if (!r.ok) { last = r.status; console.error("gemini error", model, r.status, JSON.stringify(j)); continue; }
      const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
      const text = parts.map(p => p.text || "").join("").trim();
      if (text) return res.status(200).json({ text });
      last = 204;
    } catch (e) { console.error(e); last = 500; }
  }
  return res.status(502).json({ error: "upstream", status: last });
};

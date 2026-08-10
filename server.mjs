import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");

function json(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(data);
}

function scoreTransaction({ amount, asset, recipient }) {
  const n = Number(amount) || 0;
  let score = 42;
  if (asset === "SOL") score += Math.min(12, n * 1.5);
  if (asset === "USDC" || asset === "USDT") score += Math.min(8, n / 500);
  if (recipient && recipient.length > 38) score += 7;
  if (recipient && /^(7x|9x|Demo)/i.test(recipient)) score += 8;
  score = Math.max(8, Math.min(96, Math.round(score)));

  const level = score >= 70 ? "HIGH" : score >= 45 ? "MEDIUM" : "LOW";
  const action = level === "HIGH" ? "PAUSE & REVIEW" :
                 level === "MEDIUM" ? "REVIEW BEFORE SIGNING" : "LOWER RISK";

  const signals = level === "HIGH"
    ? [
        ["HIGH", "Elevated transaction exposure", "Demo signal — review destination and transaction context."],
        ["MEDIUM", "Counterparty requires review", "Verify recipient identity and recent activity before signing."],
        ["MEDIUM", "Value movement detected", "Large or unusual value movement should receive additional review."]
      ]
    : level === "MEDIUM"
    ? [
        ["MEDIUM", "Review recommended", "Confirm the recipient and transaction intent before signing."],
        ["LOW", "No execution performed", "SafePay is only evaluating the transaction in this demo."],
        ["LOW", "Context incomplete", "Provider-backed intelligence can add deeper signals in live mode."]
      ]
    : [
        ["LOW", "No major demo flags", "The synthetic demo model found limited risk indicators."],
        ["LOW", "Review destination", "Always verify the address independently before signing."],
        ["LOW", "No execution performed", "This prototype never signs or broadcasts transactions."]
      ];

  return {
    demo: true,
    score,
    level,
    action,
    explanation: level === "HIGH"
      ? "Risk signals indicate elevated exposure or uncertainty. Pause and verify the counterparty, destination and transaction details before signing."
      : level === "MEDIUM"
      ? "The transaction can proceed only after a careful review of the recipient, amount and transaction context. SafePay recommends a deliberate pre-sign check."
      : "The demo model found limited risk indicators, but users should still independently verify the destination and transaction details.",
    signals
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (req.method === "GET" && url.pathname === "/api/health") {
    return json(res, 200, { ok: true, version: "0.5.0", mode: "DEMO" });
  }

  if (req.method === "POST" && url.pathname === "/api/transaction-risk") {
    let raw = "";
    req.on("data", c => raw += c);
    req.on("end", () => {
      try {
        const body = JSON.parse(raw || "{}");
        if (!body.sender || !body.recipient || !body.amount) {
          return json(res, 400, { error: "Sender, recipient and amount are required." });
        }
        return json(res, 200, scoreTransaction(body));
      } catch {
        return json(res, 400, { error: "Invalid JSON." });
      }
    });
    return;
  }

  let filePath = url.pathname === "/" ? path.join(publicDir, "index.html")
                                      : path.join(publicDir, url.pathname.replace(/^\/+/, ""));
  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath);
    const types = { ".html":"text/html", ".css":"text/css", ".js":"text/javascript", ".svg":"image/svg+xml" };
    res.writeHead(200, { "Content-Type": (types[ext] || "application/octet-stream") + "; charset=utf-8" });
    res.end(data);
  } catch {
    res.writeHead(404, {"Content-Type":"text/plain; charset=utf-8"});
    res.end("Not found");
  }
});

server.listen(3000, () => {
  console.log("SafePay AI v0.5 running at http://localhost:3000 | DEMO MODE");
});
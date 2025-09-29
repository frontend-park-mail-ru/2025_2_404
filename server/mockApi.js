const http = require("http");
const { randomUUID } = require("crypto");
const url = require("url");

const PORT = 3000;
const PREFIX = "/api/v1";
const FRONT_ORIGIN = "http://localhost:8000";

const users = [];        
const ads = [];           
const sessions = new Map(); 

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(data || "{}")); }
      catch { resolve({}); }
    });
  });
}

function pickName(body) {
  return body?.name ?? body?.user_name ?? body?.username ?? null;
}


function parseCookies(req) {
  const raw = req.headers.cookie || "";
  return raw.split(";").reduce((acc, pair) => {
    const [k, v] = pair.split("=").map((s) => (s || "").trim());
    if (k) acc[k] = decodeURIComponent(v || "");
    return acc;
  }, {});
}

function cors(res, origin) {
  res.setHeader("Access-Control-Allow-Origin", FRONT_ORIGIN); // строго
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
}

function sendJSON(res, status, body, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  Object.entries(extraHeaders).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(body));
}

function validationError(message) {
  return { error: { code: "VALIDATION_ERROR", message } };
}

function conflictError(message) {
  return { error: { code: "CONFLICT", message } };
}

function unauthorizedError(message = "Unauthorized") {
  return { error: { code: "UNAUTHORIZED", message } };
}

const server = http.createServer(async (req, res) => {
  cors(res, req.headers.origin);

  // preflight
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  const { pathname } = url.parse(req.url, true);
  if (!pathname.startsWith(PREFIX)) {
    res.statusCode = 404;
    return res.end("Not Found");
  }

  // routes
    // POST /api/v1/signup
    if (req.method === "POST" && pathname === `${PREFIX}/signup`) {
    const body = await readBody(req);
    const { email, password } = body || {};
    const name = pickName(body);           

    if (!email || !password || !name) {
        return sendJSON(res, 422, validationError("email, password, name required"));
    }
    if (users.find(u => u.email.toLowerCase() === String(email).toLowerCase())) {
        return sendJSON(res, 409, conflictError("Email already taken"));
    }

    const user = { id: randomUUID(), email, name, passwordHash: password };
    users.push(user);

    return sendJSON(res, 201, { id: user.id, email: user.email, name: user.name });
    }

  // POST /api/v1/signin
  if (req.method === "POST" && pathname === `${PREFIX}/signin`) {
    const body = await readBody(req);
    const { email, password } = body || {};
    if (!email || !password) {
      return sendJSON(res, 422, validationError("email, password required"));
    }
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password
    );
    if (!user) {
      return sendJSON(res, 401, { error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" } });
    }
    const sid = randomUUID();
    sessions.set(sid, user.id);
    // HttpOnly session cookie
    res.setHeader("Set-Cookie", `sid=${sid}; HttpOnly; Path=/; SameSite=Lax`);
    return sendJSON(res, 200, { id: user.id, email: user.email, name: user.name });
  }

  // GET /api/v1/ads
  if (req.method === "GET" && pathname === `${PREFIX}/ads`) {
    return sendJSON(res, 200, ads);
  }

  // POST /api/v1/ads (auth required)
  if (req.method === "POST" && pathname === `${PREFIX}/ads`) {
    const cookies = parseCookies(req);
    const sid = cookies.sid;
    const userId = sid && sessions.get(sid);
    if (!userId) {
      return sendJSON(res, 401, unauthorizedError("No or invalid session"));
    }
    const body = await readBody(req);
    const { title, text, file_path } = body || {};
    if (!title || !text) {
      return sendJSON(res, 422, validationError("title and text are required"));
    }
    const ad = {
      ad_id: randomUUID(),
      creator_id: userId,
      title: String(title).slice(0, 140),
      text: String(text).slice(0, 1000),
      ...(file_path ? { file_path } : {}),
    };
    ads.push(ad);
    return sendJSON(res, 201, ad);
  }

  // GET /api/v1/ads/{ad_id}
  const adIdMatch = pathname.match(new RegExp(`^${PREFIX}/ads/([0-9a-fA-F-]{36})$`));
  if (req.method === "GET" && adIdMatch) {
    const ad = ads.find((a) => a.ad_id === adIdMatch[1]);
    if (!ad) return sendJSON(res, 404, { error: { code: "NOT_FOUND", message: "Ad not found" } });
    return sendJSON(res, 200, ad);
  }

  res.statusCode = 404;
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`Mock API running at http://localhost:${PORT}${PREFIX}`);
});

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8000;

const ROOT = path.join(__dirname, "..");

const routes = {
  "/": path.join(ROOT, "index.html"),
};

/**
 * HTTP сервер для статических файлов
 * @module app
 */
http.createServer((request, response) => {
  let filePath = routes[request.url] || path.join(ROOT, request.url);

  if (!path.extname(filePath) && request.url !== "/" && !routes[request.url]) {
    filePath += ".html";
  }

  const ext = path.extname(filePath);
  let contentType = "text/html; charset=utf-8";
  if (ext === ".css") contentType = "text/css; charset=utf-8";
  if (ext === ".js") contentType = "text/javascript; charset=utf-8";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      fs.readFile(path.join(ROOT, "notFound.html"), (err404, data404) => {
        response.statusCode = 404;
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        if (err404) return response.end("404 Not Found");
        response.end(data404);
      });
    } else {
      response.setHeader("Content-Type", contentType);
      response.end(content);
    }
  });
}).listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const ROOT = path.join(__dirname, '..'); 
http
  .createServer((request, response) => {
    let filePath = path.join(ROOT, request.url);
    const ext = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.hbs': 'text/plain; charset=utf-8',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.woff2': 'font/woff2',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT' || error.code === 'EISDIR') {
          if (!ext) {
            fs.readFile(path.join(ROOT, 'index.html'), (errIndex, indexContent) => {
              if (errIndex) {
                response.writeHead(500);
                response.end('Ошибка сервера: не могу прочитать index.html');
              } else {
                response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                response.end(indexContent);
              }
            });
          } else {
            response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            response.end('<div class="error-page"><h1>404: Страница не найдена</h1></div>');
          }
        } else {
          response.writeHead(500);
          response.end(`Ошибка сервера: ${error.code}`);
        }
      } else {
        response.writeHead(200, { 'Content-Type': contentType });
        response.end(content);
      }
    });
  })
  .listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен: http://89.208.230.119:${PORT} или http://localhost:8000/
`);
  });

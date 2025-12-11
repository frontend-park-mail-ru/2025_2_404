const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

// Production: раздаём из dist, Development: из корня
const distPath = path.join(__dirname, '..', 'dist');
const ROOT = fs.existsSync(distPath) ? distPath : path.join(__dirname, '..'); 
const requestHandler = (request, response) => {
    let filePath = path.join(ROOT, request.url);
    if (filePath.endsWith(path.sep) || request.url === '/') {
        filePath = path.join(ROOT, 'index.html');
    }

    const ext = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.mjs': 'text/javascript; charset=utf-8',
        '.ts': 'text/javascript; charset=utf-8',
        '.hbs': 'text/plain; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.ico': 'image/x-icon',
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT' || error.code === 'EISDIR') {
          if (!ext) {
            fs.readFile(path.join(ROOT, 'index.html'), (errIndex, indexContent) => {
              if (errIndex) {
                response.writeHead(500);
                response.end('Error loading index.html');
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
};

const certPath = path.join(__dirname, 'cert', 'cert.pem');
const keyPath = path.join(__dirname, 'cert', 'key.pem');

let server;
let protocol = 'http';
if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    console.log('Найдены сертификаты. Запуск в режиме HTTPS.');
    try {
        const options = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
        };
        server = https.createServer(options, requestHandler);
        protocol = 'https';
    } catch (e) {
        console.error("Ошибка чтения сертификатов, откат на HTTP:", e.message);
        server = http.createServer(requestHandler);
    }
} else {
    console.log('Сертификаты не найдены. Запуск в режиме HTTP (для Nginx).');
    server = http.createServer(requestHandler);
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен: ${protocol}://localhost:${PORT}`);
    console.log(`Раздача файлов из: ${ROOT}`);
});

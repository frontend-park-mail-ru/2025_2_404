import http from 'http';
import fs from 'fs';
import path from 'path';

const routes = {
  '/': './index.html',
  '/signin': './signIn.html',
  '/signup': './signUp.html'
};

http.createServer((request, response) => {
    // Определяем путь к файлу
    let filePath = routes[request.url] || ('.' + request.url);

    // если путь без расширения — добавим .html
    if (!path.extname(filePath) && request.url !== '/' && !routes[request.url]) {
      filePath += '.html';
    }
    
    // Определяем MIME-тип
    let ext = path.extname(filePath);
    let contentType = 'text/html; charset=utf-8';
    if (ext === '.css') contentType = 'text/css; charset=utf-8';
    if (ext === '.js') contentType = 'text/javascript; charset=utf-8';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        fs.readFile('./notFound.html', (err404, data404) => {
          response.statusCode = 404;
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          if (err404) {
            // Если и 404.html нет: хотя бы текст
            return response.end('404 Not Found');
          }
          response.end(data404);
        });
      } else {
        response.setHeader('Content-Type', contentType);
        response.end(content);
      }
    });
  })
  .listen(3000, () => {
    console.log('Сервер запущен: http://localhost:3000');
  });

const http = require('http');
const httpProxy = require('http-proxy');
const fs = require('fs');
const path = require('path');

// Створюємо проксі-сервер
const proxy = httpProxy.createProxyServer();

// Список серверів (екземплярів додатка)
const servers = [
  { host: 'localhost', port: 8081 },
  { host: 'localhost', port: 8082 }
];

let currentServerIndex = 0; // Поточний сервер для алгоритму round-robin

// Кеш для статичного контенту
const staticCache = new Map();

// Статична папка
const staticFolder = path.resolve(__dirname, 'public');

// Перевіряємо, чи запит на статичний файл
function isStaticFile(url) {
  return url.startsWith('/static/');
}

// Завантажуємо файл у кеш
function cacheStaticFile(filePath, res) {
  try {
    const fileData = fs.readFileSync(filePath);
    staticCache.set(filePath, fileData);
    console.log(`Файл закешовано: ${filePath}`);
    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(fileData);
  } catch (err) {
    console.error(`Помилка читання файлу: ${filePath}`, err);
    res.writeHead(404);
    res.end('Файл не знайдено');
  }
}

// Визначаємо Content-Type для файлів
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

// Балансувальник
const loadBalancer = http.createServer((req, res) => {
  if (isStaticFile(req.url)) {
    // Обробка статичних файлів
    const filePath = path.join(staticFolder, req.url.replace('/static/', ''));

    if (staticCache.has(filePath)) {
      // Якщо файл в кеші
      console.log(`Відповідь із кешу для: ${filePath}`);
      res.writeHead(200, { 'Content-Type': getContentType(filePath) });
      res.end(staticCache.get(filePath));
    } else {
      // Якщо файл не в кеші
      cacheStaticFile(filePath, res);
    }
  } else {
    // Обробка динамічних запитів
    const target = servers[currentServerIndex];
    currentServerIndex = (currentServerIndex + 1) % servers.length; // Round-robin
    console.log(`Проксую запит на сервер: ${target.host}:${target.port}`);

    proxy.web(req, res, { target: `http://${target.host}:${target.port}` }, (err) => {
      console.error('Помилка проксування:', err);
      res.writeHead(500);
      res.end('Помилка на стороні балансувальника');
    });
  }
});

// Запуск балансувальника
const PORT = 8000;
loadBalancer.listen(PORT, () => {
  console.log(`Балансувальник навантаження запущено на http://localhost:${PORT}`);
});

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const wss = new WebSocket.Server({ port: 8080 });

let currentHash = 'initial-hash';
const modulePath = path.join(__dirname, 'module.js');

function generateHash(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

function readModuleContent() {
  return fs.readFileSync(modulePath, 'utf-8');
}

let moduleContent = readModuleContent();
currentHash = generateHash(moduleContent);

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send the current hash to the client
  ws.send(JSON.stringify({ type: 'hash', hash: currentHash }));

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    console.log('Received message:', data);

    if (data.type === 'check') {
      if (data.hash !== currentHash) {
        ws.send(JSON.stringify({ 
          type: 'update', 
          hash: currentHash, 
          modules: ['module.js']
        }));
      } else {
        ws.send(JSON.stringify({ type: 'no-update' }));
      }
    } else if (data.type === 'get-update') {
      ws.send(JSON.stringify({ 
        type: 'module-update', 
        module: data.module, 
        content: moduleContent 
      }));
    }
  });
});

// Watch for file changes
fs.watch(modulePath, (eventType, filename) => {
  if (eventType === 'change') {
    console.log(`File ${filename} has been changed`);
    moduleContent = readModuleContent();
    const newHash = generateHash(moduleContent);
    
    if (newHash !== currentHash) {
      currentHash = newHash;
      console.log('New hash:', currentHash);

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'hash', hash: currentHash }));
        }
      });
    }
  }
});

console.log(`Server is watching for changes in ${modulePath}`);
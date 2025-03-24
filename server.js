const chokidar = require("chokidar");
const express = require("express");
const WebSocket = require("ws");

const app = express();
const wss = new WebSocket.Server({ noServer: true });

const getModuleId = (path) => `./${path.replace(/\\/g, "/")}`;

// 文件监听
const watcher = chokidar.watch("./src", {
  ignored: /^\./,
  persistent: true,
});

const hmrFiles = new Map();

// WebSocket通信
watcher.on("change", (path) => {
  const updateID = Date.now();

  const moduleId = getModuleId(path);

  // 生成hot-update.json
  const manifest = {
    h: updateID,
    updated: { [moduleId]: `/__hmr/${updateID}.hot-update.js` },
  };

  // 生成hot-update.js  diff-match-patch 实际可以通过这个包实现补丁推动代码，而不是全量推送
  const code = `
    (() => {
      const moduleId = ${JSON.stringify(moduleId)};
      window.webpackHotUpdate(moduleId, {
        "${moduleId}": (module, exports) => {
           const moduleCode = ${JSON.stringify(require("fs").readFileSync(path, "utf-8"))};
           eval(moduleCode);
        }
      });
    })();
  `;

  // 通过WebSocket发送元数据
  wss.clients.forEach((client) => {
    // if (client.readyState === wss.OPEN) {
      client.send(
        JSON.stringify({
          type: "hot-update",
          url: `/__hmr/${updateID}.hot-update.json`,
        })
      );
    // }
  });

  // 存储热更新文件（实际应写入内存文件系统）
  hmrFiles.set(`/__hmr/${updateID}.hot-update.json`, JSON.stringify(manifest));
  hmrFiles.set(`/__hmr/${updateID}.hot-update.js`, code);
});

// HTTP服务
const PORT = 3000;
const server = app.use(express.static("public")).listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.get("/__hmr/:filename", (req, res) => {
  const filename = `/__hmr/${req.params.filename}`;
  if (hmrFiles.has(filename)) {
    res.type("application/javascript").send(hmrFiles.get(filename));
  } else {
    res.status(404).send("File not found");
  }
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

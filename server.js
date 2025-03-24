const chokidar = require("chokidar");
const express = require("express");
const WebSocket = require("ws");
const path = require("path");
const fs = require("fs");
const esbuild = require("esbuild");

const app = express();
const wss = new WebSocket.Server({ noServer: true });

// 文件监听
const watcher = chokidar.watch("./src", {
  ignored: /^\./,
  persistent: true,
});

// WebSocket通信
watcher.on("change", (filePath) => {
  const modulePath = `/src/${path.relative("src", filePath).replace(/\\/g, "/")}`;
  console.log(`File changed: ${modulePath}`);

  // 通知客户端更新模块
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "hot-update",
          path: modulePath,
        })
      );
    }
  });
});

// 提供静态资源，包括 src 目录
app.use(express.static("public"));

// 拦截 .jsx 文件请求并动态编译
app.get("/src/*.jsx", async (req, res) => {
  const filePath = path.join(__dirname, req.path);
  try {
    const jsxCode = fs.readFileSync(filePath, "utf-8");
    const result = await esbuild.transform(jsxCode, {
      loader: "jsx",
      format: "esm",
    });
    res.setHeader("Content-Type", "application/javascript");
    res.send(result.code);
  } catch (error) {
    console.error("Failed to compile JSX:", error);
    res.status(500).send("Internal Server Error");
  }
});

// HTTP服务
const PORT = 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});



window.__webpack_modules__ = new Map();
window.webpackHotUpdate = (moduleId, newModule) => {
  const mod = __webpack_modules__.get(moduleId);
  if (mod && mod.hot) {
    mod.hot.accept((module, exports) => {
        return newModule[moduleId](module, exports);
    });
  }
};

// 模块加载包装器
function require(moduleId) {
  const mod = __webpack_modules__.get(moduleId);
  return mod?.exports;
}

const socket = new WebSocket(`ws://${location.host}`);
socket.addEventListener("message", async ({ data }) => {
  const { type, url } = JSON.parse(data);
  if (type === "hot-update") {
    // 获取hot-update.json
    const res = await fetch(url);
    const { h: version, updated } = await res.json();

    // 加载更新的文件
    await Promise.all(
      Object.values(updated).map((file) => import(`${file}?t=${version}`))
    );
  }
});


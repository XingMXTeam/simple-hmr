const socket = new WebSocket(`ws://${location.host}`);

// 模拟 Vite 的 import.meta.hot 初始化
const hotModulesMap = new Map();

function createHotContext(modulePath) {
  // 将 modulePath 转换为相对路径（去掉域名部分）
  const relativePath = new URL(modulePath, location.origin).pathname;

  return {
    accept(callback) {
      hotModulesMap.set(relativePath, callback); // 存储相对路径
    },
  };
}

socket.addEventListener("message", async ({ data }) => {
  const { type, path } = JSON.parse(data);
  if (type === "hot-update") {
    console.log(`Hot update for: ${path}`);

    try {
      // 动态重新加载模块
      const module = await import(`${path}?t=${Date.now()}`);

      // 检查是否有热更新回调
      const hotCallback = hotModulesMap.get(path); // 使用相对路径查找
      if (hotCallback) {
        hotCallback(module);
      }
    } catch (error) {
      console.error(`Failed to reload module ${path}:`, error);
    }
  }
});

// 为每个模块注入 import.meta.hot
window.__vite__ = {
  createHotContext,
};


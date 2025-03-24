// src/module.js
export function hotUpdate() {
    console.log('模块已热更新2');
}

// 模拟 Vite 的 import.meta.hot
if (!import.meta.hot) {
    import.meta.hot = window.__vite__.createHotContext(import.meta.url);
}

if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
        console.log('HMR更新回调');
        console.log('新模块:', newModule);
    });
}

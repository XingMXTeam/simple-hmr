// src/module.js
export function hotUpdate() {
    console.log('模块已热更新234');
}

// webpack 导出了一个hotUpdate函数
const mod = {
    exports: {
        hotUpdate
    },
    hot: true
}
window.__webpack_modules__.set('./src/module.js', mod);
// 开发环境注入HMR支持
// 当开启hot: true, 会发生 HMR运行时注入：Webpack在编译阶段会自动向打包后的代码注入module.hot对象和相关API，这是通过内置的HotModuleReplacementPlugin实现的
if (mod.hot) {
    mod.hot.accept = (newModule) => {
        console.log('HMR更新回调');
        Object.assign(mod.exports, newModule(module, mod.exports));
        console.log('HMR成功:', mod.exports);
    };
}

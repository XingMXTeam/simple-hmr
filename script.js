const ws = new WebSocket('ws://localhost:8080');
const updateLog = document.getElementById('update-log');

function addLog(message) {
    const logEntry = document.createElement('p');
    logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    updateLog.appendChild(logEntry);
    updateLog.scrollTop = updateLog.scrollHeight;
    console.log(message); // 同时在控制台输出日志
}

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received message:', data);
    addLog(`Received message: ${JSON.stringify(data)}`);

    if (data.type === 'hash') {
        addLog(`New hash received: ${data.hash}`);
        ws.send(JSON.stringify({ type: 'check', hash: data.hash }));
    } else if (data.type === 'update') {
        addLog(`Update available for modules: ${data.modules.join(', ')}`);
        data.modules.forEach(module => {
            ws.send(JSON.stringify({ type: 'get-update', module }));
        });
    } else if (data.type === 'module-update') {
        addLog(`Received update for module: ${data.module}`);
        loadUpdate(data.module, data.content);
    }
};

// 初始模块定义和使用
ws.onopen = () => {
    addLog('WebSocket connected. Requesting initial module...');
    ws.send(JSON.stringify({ type: 'get-update', module: 'module.js' }));
};

function loadUpdate(module, content) {
    addLog(`Applying update for module: ${module}`);
    // 使用 Function 构造函数来执行模块代码，这样可以在全局作用域中执行
    const executeModule = new Function('define', 'require', content);
    executeModule(define, require);
    if (window.hotUpdate) {
        window.hotUpdate(module);
    }
}

window.hotUpdate = function (moduleId) {
    addLog(`Hot update applied for module: ${moduleId}`);
    const module = modules[moduleId];
    if (module && module.hot && module.hot.callback) {
        module.hot.callback();
    }
};

// 示例模块定义
function define(moduleId, factory) {
    const module = {
        exports: {},
        hot: {
            accept: (callback) => {
                module.hot.callback = callback;
            }
        }
    };
    addLog(`Defining module: ${moduleId}`);
    factory(module, module.exports, require);
    modules[moduleId] = module;
    // 立即执行模块的 hello 函数
    if (module.exports.hello) {
        module.exports.hello();
    }
}

const modules = {};
function require(moduleId) {
    addLog(`Requiring module: ${moduleId}`);
    return modules[moduleId].exports;
}

define('module.js', (module, exports, require) => {
    exports.hello = () => {
        const app = document.getElementById('app');
        app.textContent = `Hello, HMR World! Last updated: ${new Date().toLocaleTimeString()}`;
    };

    module.hot.accept(() => {
        console.log('Module updated, re-rendering...');
        addLog('Module updated, re-rendering...');
        exports.hello();
    });
});

// 初始模块使用
const mod = require('module.js');
mod.hello();
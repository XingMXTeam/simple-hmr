## 实现原理

用websocket进行通信

server: 通过服务端下发hash, 客户端根据hash check具体更新内容，根据check回来的内容请求服务端具体的热更新代码。

client: 
- 使用模块系统开启hmr， 每个模块注入hot和全局注入hotUpdate方法；
- client监听到服务端下发新的hash，使用hash去服务端check，check到有更新，直接以jsonp的方式加载，加载后调用全局的hotUpdate方法进入热更新流程
- hotUpdate会处理更新的目标内容。

## webpack vs vite

webpack：
- 需要完整解析文件依赖关系
- 然后通过loader: babel -> typescript -> sass编译处理
- 将所有模块编译后返回，改一个文件，仍然会将所有依赖编译成一个大bundle

vite：
- 预构建阶段用 esbuild 将 CommonJS 依赖（如 lodash）转换为 ESM 单文件（如 node_modules/.vite/lodash.js）。 
- 然后浏览器通过ESM（type='module') 加载未编译源码，vite服务端会按需转为es模块返回

这样的区别是vite只需要编译需要的文件，通过websocket推送，
但是webpack需要重新构建受影响的模块，然后通过补丁文件xx.hot-update.js
推送变动。（hot-update.json 是改动的文件列表）

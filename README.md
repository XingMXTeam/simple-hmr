## 实现原理

用websocket进行通信

server: 通过服务端下发hash, 客户端根据hash check具体更新内容，根据check回来的内容请求服务端具体的热更新代码。

client: 
- 使用模块系统开启hmr， 每个模块注入hot和全局注入hotUpdate方法；
- client监听到服务端下发新的hash，使用hash去服务端check，check到有更新，直接以jsonp的方式加载，加载后调用全局的hotUpdate方法进入热更新流程
- hotUpdate会处理更新的目标内容。
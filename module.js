define('module.js', (module, exports, require) => {
    exports.hello = () => {
      const app = document.getElementById('app');
      app.textContent = 'Hello, HMR World! Version 1';
    };
  
    module.hot.accept(() => {
      console.log('Module updated, re-rendering...');
      exports.hello();
    });
  });
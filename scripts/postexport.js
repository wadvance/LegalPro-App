const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const webDir = path.join(__dirname, '..', 'web');

fs.copyFileSync(path.join(webDir, 'manifest.json'), path.join(distDir, 'manifest.json'));
fs.copyFileSync(path.join(webDir, 'sw.js'), path.join(distDir, 'sw.js'));

const indexPath = path.join(distDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const headTags = `
    <link rel="manifest" href="/manifest.json" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <link rel="apple-touch-icon" href="/favicon.ico" />
    <style>
      #root .loading-message { display: flex; align-items: center; justify-content: center; height: 100%; font-family: sans-serif; color: #FFFFFF; background: #1A237E; font-size: 18px; font-weight: bold; }
    </style>
    <script>
      var root = document.getElementById('root');
      if (root) root.innerHTML = '<div class="loading-message"><div style="text-align:center"><div style="font-size:48px;margin-bottom:16px">⚖️</div><div>Cargando...</div></div></div>';
      window.addEventListener('error', function(e) {
        var d = document.getElementById('root');
        if (d) d.innerHTML = '<div style="padding:40px;font-family:sans-serif;background:#fff;min-height:100vh"><h2 style="color:#D32F2F">Error de carga</h2><pre style="white-space:pre-wrap;color:#333;font-size:14px">' + (e.message || (e.error && e.error.message) || 'Unknown error') + '</pre><p style="color:#888;font-size:12px">' + (e.filename || '') + ':' + (e.lineno || '') + ':' + (e.colno || '') + '</p></div>';
        return false;
      });
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(regs) { regs.forEach(function(r) { r.unregister(); }); });
        window.addEventListener('load', function() { navigator.serviceWorker.register('/sw.js'); });
      }
    </script>`;

html = html.replace('</head>', headTags + '\n  </head>');

fs.writeFileSync(indexPath, html);

console.log('PWA setup complete');

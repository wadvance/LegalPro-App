const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const webDir = path.join(__dirname, '..', 'web');
const basePath = '/LegalPro-App';

fs.copyFileSync(path.join(webDir, 'manifest.json'), path.join(distDir, 'manifest.json'));
fs.copyFileSync(path.join(webDir, 'sw.js'), path.join(distDir, 'sw.js'));

const iconSizes = ['48', '72', '96', '120', '128', '144', '152', '167', '180', '192', '384', '512'];
iconSizes.forEach((size) => {
  const src = path.join(webDir, `icon-${size}.png`);
  const dest = path.join(distDir, `icon-${size}.png`);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
});

const indexPath = path.join(distDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

html = html
  .replace(/href="\//g, `href="${basePath}/`)
  .replace(/src="\//g, `src="${basePath}/`)
  .replace(/href='\//g, `href='${basePath}/`)
  .replace(/src='\//g, `src='${basePath}/`)
  .replace(new RegExp(`${basePath}${basePath}`, 'g'), basePath);

html = html.replace('<html lang="en">', '<html lang="es">');

const headTags = `
    <link rel="manifest" href="${basePath}/manifest.json" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Bufete de Abogados" />
    <link rel="apple-touch-icon" href="${basePath}/icon-180.png" />
    <link rel="apple-touch-icon" sizes="120x120" href="${basePath}/icon-120.png" />
    <link rel="apple-touch-icon" sizes="152x152" href="${basePath}/icon-152.png" />
    <link rel="apple-touch-icon" sizes="167x167" href="${basePath}/icon-167.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="${basePath}/icon-180.png" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="application-name" content="Bufete de Abogados" />
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
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('${basePath}/sw.js', { scope: '${basePath}/' });
        });
      }
      var deferredPrompt;
      window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
        deferredPrompt = e;
      });
      window.addEventListener('appinstalled', function() {
        deferredPrompt = null;
      });
    </script>`;

html = html.replace('</head>', headTags + '\n  </head>');

fs.writeFileSync(indexPath, html);

console.log('PWA setup complete with basePath:', basePath);

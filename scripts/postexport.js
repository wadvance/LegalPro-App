const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const webDir = path.join(__dirname, '..', 'web');

// Copy manifest.json
fs.copyFileSync(path.join(webDir, 'manifest.json'), path.join(distDir, 'manifest.json'));

// Copy sw.js
fs.copyFileSync(path.join(webDir, 'sw.js'), path.join(distDir, 'sw.js'));

// Patch index.html
const indexPath = path.join(distDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const headTags = `
    <link rel="manifest" href="/manifest.json" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <link rel="apple-touch-icon" href="/favicon.ico" />
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js');
        });
      }
    </script>`;

html = html.replace('</head>', headTags + '\n  </head>');

fs.writeFileSync(indexPath, html);

console.log('PWA setup complete');

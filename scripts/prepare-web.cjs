const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const webDir = path.join(root, 'www');
fs.mkdirSync(webDir, { recursive: true });
fs.copyFileSync(path.join(root, 'styles.css'), path.join(webDir, 'styles.css'));
fs.copyFileSync(path.join(root, 'supabase-config.js'), path.join(webDir, 'supabase-config.js'));

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  .replace('<script src="supabase-config.js"></script>\n  <script src="script.js"></script>', '<script src="supabase-config.js"></script>\n  <script src="app.js"></script>');
if (html === fs.readFileSync(path.join(root, 'index.html'), 'utf8')) {
  throw new Error('Could not find the website script entry point in index.html.');
}
fs.writeFileSync(path.join(webDir, 'index.html'), html);

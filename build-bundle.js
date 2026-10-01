const fs = require('fs');

const order = [
  'audio.js',
  'particles.js',
  'renderer.js',
  'camera.js',
  'world.js',
  'player.js',
  'controller.js',
  'combat.js',
  'enemies.js',
  'ui.js',
  'main.js'
];

let bundle = '/* Cyber Shift: Apex Vanguard - Standalone Game Bundle */\n(() => {\n"use strict";\n';

for (const file of order) {
  let content = fs.readFileSync('src/' + file, 'utf8');
  // Strip import statements
  content = content.replace(/^import\s+.*?;?\s*$/gm, '');
  // Strip export prefixes
  content = content.replace(/^export\s+(class|const|function|let|var)\s+/gm, '$1 ');
  bundle += '\n// === ' + file + ' ===\n' + content + '\n';
}

bundle += '})();\n';

fs.writeFileSync('game.bundle.js', bundle);
console.log('Successfully created game.bundle.js, total bytes:', bundle.length);

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { getState } = require('../state');

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const PRESENTATION_DIR = path.join(PROJECT_ROOT, 'public', 'presentation');

test('封面只展示 WOTA艺基础讲座 大标题', () => {
  const html = fs.readFileSync(path.join(PRESENTATION_DIR, 'index.html'), 'utf8');

  assert.match(html, /<section id="cover"[\s\S]*?<h1>WOTA艺基础讲座<\/h1>[\s\S]*?<\/section>/);
  assert.doesNotMatch(html, /Mizuki水木<\/span>wota艺部/);
  assert.doesNotMatch(html, /Wota艺基础讲座 · 荧光棒舞蹈互动体验/);
});

test('BATTLE 1 使用暂定、僵尸与 LOVE 2000 资源', () => {
  const html = fs.readFileSync(path.join(PRESENTATION_DIR, 'index.html'), 'utf8');
  const battle1 = getState().battles.battle1;

  assert.equal(battle1.dancer1.name, '暂定');
  assert.equal(battle1.dancer2.name, '僵尸');
  assert.match(battle1.dancer1.avatar, /battle1-dancer1\.jpg$/);
  assert.match(battle1.dancer2.avatar, /battle1-dancer2\.jpg$/);

  assert.match(html, /BATTLE 1 · 暂定 vs 僵尸/);
  assert.match(html, /assets\/images\/love-2000-cover\.webp/);
  assert.match(html, /assets\/music\/love-2000\.mp3/);

  [
    'assets/images/battle1-dancer1.jpg',
    'assets/images/battle1-dancer2.jpg',
    'assets/images/love-2000-cover.webp',
    'assets/music/love-2000.mp3'
  ].forEach((relativePath) => {
    assert.equal(fs.existsSync(path.join(PRESENTATION_DIR, relativePath)), true, relativePath);
  });
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { getState } = require('../state');

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const PRESENTATION_DIR = path.join(PROJECT_ROOT, 'public', 'presentation');

test('封面按 PPTX 第一页展示三行标题与原始图片素材', () => {
  const html = fs.readFileSync(path.join(PRESENTATION_DIR, 'index.html'), 'utf8');

  assert.match(html, /<section id="cover" class="cover-exact"/);
  assert.match(html, /<span class="cover-mizuki">Mizuki<\/span>/);
  assert.match(html, /<span class="cover-brand">水木<span class="cover-wota">wota<\/span>艺部<\/span>/);
  assert.match(html, /<span class="cover-lecture">基础讲座<\/span>/);

  [
    'assets/images/cover-dancer-right.png',
    'assets/images/cover-dancer-left.png'
  ].forEach((relativePath) => {
    assert.match(html, new RegExp(relativePath.replace(/\./g, '\\.')));
    assert.equal(fs.existsSync(path.join(PRESENTATION_DIR, relativePath)), true, relativePath);
  });

  const css = fs.readFileSync(path.join(PRESENTATION_DIR, 'css', 'theme-wotagei.css'), 'utf8');
  assert.match(css, /cover-stage\.png/);
  assert.equal(
    fs.existsSync(path.join(PRESENTATION_DIR, 'assets', 'images', 'cover-stage.png')),
    true
  );
});

test('演示端自托管两套汉仪字体', () => {
  const html = fs.readFileSync(path.join(PRESENTATION_DIR, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(PRESENTATION_DIR, 'css', 'theme-wotagei.css'), 'utf8');

  assert.match(css, /font-family: 'HYHanHeiW'/);
  assert.match(css, /font-family: 'HYWenHei-85W'/);
  assert.match(html, /assets\/fonts\/HYHanHeiW\.woff2/);
  assert.match(html, /assets\/fonts\/HYWenHei-85W\.woff2/);

  [
    'assets/fonts/HYHanHeiW.woff2',
    'assets/fonts/HYWenHei-85W.woff2',
    'assets/fonts/FONT-NOTICE.md'
  ].forEach((relativePath) => {
    const fontPath = path.join(PRESENTATION_DIR, relativePath);
    assert.equal(fs.existsSync(fontPath), true, relativePath);
  });

  assert.equal(
    fs.readFileSync(path.join(PRESENTATION_DIR, 'assets', 'fonts', 'HYHanHeiW.woff2'))
      .subarray(0, 4)
      .toString('ascii'),
    'wOF2'
  );
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
  assert.match(html, /data-step="vs"[\s\S]*?>VS<\/div>/);
  assert.match(html, /data-fragment-index="0"[\s\S]*?曲目揭晓！/);
  assert.match(html, /data-fragment-index="1"[\s\S]*?LOVE 2000 专辑封面/);
  assert.match(html, /class="stage-panel battle-music-panel"/);
  assert.match(html, /class="battle-music-faceoff"/);

  [
    'assets/images/battle1-dancer1.jpg',
    'assets/images/battle1-dancer2.jpg',
    'assets/images/love-2000-cover.webp',
    'assets/music/love-2000.mp3'
  ].forEach((relativePath) => {
    assert.equal(fs.existsSync(path.join(PRESENTATION_DIR, relativePath)), true, relativePath);
  });
});

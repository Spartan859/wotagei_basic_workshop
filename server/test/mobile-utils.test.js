const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('手机端公共脚本可安全转义动态选手信息', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', '..', 'public', 'mobile', 'js', 'mobile.js'),
    'utf8'
  );
  const context = vm.createContext({
    window: { location: { origin: 'http://localhost:3000' } },
    localStorage: {},
    document: {},
    console
  });

  vm.runInContext(source, context);

  assert.equal(
    vm.runInContext(`escapeHtml('<img src=x onerror="alert(1)">')`, context),
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
  );
});

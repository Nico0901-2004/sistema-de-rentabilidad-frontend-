const base = require('@playwright/test');
const {
  resetLoginGuards,
  closeLoginGuardResetConnection,
} = require('../helpers/loginGuards');

const test = base.test.extend({
  _loginGuardReset: [async ({ browserName }, use) => {
    void browserName;
    await resetLoginGuards();

    try {
      await use();
    } finally {
      await resetLoginGuards();
    }
  }, { auto: true }],

  _loginGuardConnection: [async ({ browserName }, use) => {
    void browserName;
    try {
      await use();
    } finally {
      await closeLoginGuardResetConnection();
    }
  }, { scope: 'worker', auto: true }],
});

module.exports = {
  test,
  expect: base.expect,
};

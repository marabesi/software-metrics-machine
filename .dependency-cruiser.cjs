module.exports = {
  forbidden: [
    {
      name: 'cli-source-must-not-import-webapp',
      severity: 'error',
      from: { path: '^apps/cli/src/' },
      to: { path: '^apps/webapp/' },
    },
    {
      name: 'cli-source-must-not-import-webapp-package',
      severity: 'error',
      from: { path: '^apps/cli/src/' },
      to: { path: '^@smmachine/webapp($|/)' },
    },
    {
      name: 'cli-source-must-not-import-rest',
      severity: 'error',
      from: { path: '^apps/cli/src/' },
      to: { path: '^apps/rest/' },
    },
    {
      name: 'cli-source-must-not-import-rest-package',
      severity: 'error',
      from: { path: '^apps/cli/src/' },
      to: { path: '^@smmachine/rest($|/)' },
    },
    {
      name: 'webapp-source-must-not-import-cli',
      severity: 'error',
      from: { path: '^apps/webapp/' },
      to: { path: '^apps/cli/' },
    },
    {
      name: 'webapp-source-must-not-import-cli-package',
      severity: 'error',
      from: { path: '^apps/webapp/' },
      to: { path: '^@smmachine/cli($|/)' },
    },
    {
      name: 'webapp-source-must-not-import-rest',
      severity: 'error',
      from: { path: '^apps/webapp/' },
      to: { path: '^apps/rest/' },
    },
    {
      name: 'webapp-source-must-not-import-rest-package',
      severity: 'error',
      from: { path: '^apps/webapp/' },
      to: { path: '^@smmachine/rest($|/)' },
    },
    {
      name: 'rest-source-must-not-import-cli',
      severity: 'error',
      from: { path: '^apps/rest/src/' },
      to: { path: '^apps/cli/' },
    },
    {
      name: 'rest-source-must-not-import-cli-package',
      severity: 'error',
      from: { path: '^apps/rest/src/' },
      to: { path: '^@smmachine/cli($|/)' },
    },
    {
      name: 'rest-source-must-not-import-webapp',
      severity: 'error',
      from: { path: '^apps/rest/src/' },
      to: { path: '^apps/webapp/' },
    },
    {
      name: 'rest-source-must-not-import-webapp-package',
      severity: 'error',
      from: { path: '^apps/rest/src/' },
      to: { path: '^@smmachine/webapp($|/)' },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
  },
};

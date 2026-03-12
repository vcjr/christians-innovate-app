/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allowed scopes for this project
    'scope-enum': [
      2,
      'always',
      [
        'admin',
        'dashboard',
        'plans',
        'meetings',
        'directory',
        'auth',
        'bible',
        'email',
        'pwa',
        'db',
        'api',
        'deps',
        'release',
      ],
    ],
    // Relax scope to allow omitting it
    'scope-empty': [0],
    // Subject must be lower-case
    'subject-case': [2, 'always', 'lower-case'],
    // Max subject line length
    'header-max-length': [2, 'always', 100],
  },
};

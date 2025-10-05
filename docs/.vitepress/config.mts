import { defineConfig, HeadConfig } from 'vitepress'
const head: HeadConfig[] = [];
// @ts-ignore
const { NODE_ENV } = process.env;

if (NODE_ENV === 'production') {
  const id = 'G-0WD7NN88MZ';
  head.push([
    'script',
    {
      async: 'true',
      src: 'https://www.googletagmanager.com/gtag/js?id=' + id,
    },
  ]);
  head.push(
    [
      'script',
      {},
      "window.dataLayer = window.dataLayer || [];  function gtag(){dataLayer.push(arguments);}  gtag('js', new Date());  gtag('config', '" + id + "'); gtag('set', 'cookie_flags', 'SameSite=None;Secure');",
    ]);
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Software metrics machine",
  description: "Stop pointing, start measuring",
  base: '/software-metrics-machine/',
  head,
  themeConfig: {
    returnToTopLabel: 'Back to top',
    editLink: {
      pattern: 'https://github.com/marabesi/software-metrics-machine/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present Matheus Marabesi marabesi.com'
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is SMM', link: '/what-is-smm' },
          { text: 'Getting started', link: '/getting-started' },
          { text: 'Your first analysis', link: '/your-first-analysis-with-github' },
        ]
      },
      {
        text: 'Integrations',
        items: [
          { text: 'GitHub', link: '/github', items: [
            { text: 'CLI', link: '/github/cli' },
            { text: 'Pull requests', link: '/github/cli-prs' },
            { text: 'Workflows', link: '/github/cli-workflows' },
          ]},
          { text: 'Codemaat', link: '/codemaat', items: [
            { text: 'CLI', link: '/codemaat/cli' },
          ]},
          // { text: 'GitLab', link: '/gitlab' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/marabesi/software-metrics-machine' }
    ],

    search: {
      provider: 'local'
    }
  }
})

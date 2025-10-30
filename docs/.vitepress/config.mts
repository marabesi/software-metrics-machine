import { defineConfig, HeadConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid';

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
export default withMermaid(
  defineConfig({
    sitemap: {
      hostname: 'https://marabesi.com/software-metrics-machine'
    },
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
            { text: 'What is SMM', link: '/what-is-smm', items: [] },
            { text: 'Privacy first', link: '/privacy-first' },
            { text: 'Supported providers', link: '/supported-providers' },
            { text: 'Getting started', link: '/getting-started' },
            { text: 'Your first analysis', link: '/your-first-analysis-with-github' },
          ]
        },
        {
          text: 'Features',
          items: [
            {
              text: 'Dashboard', link: '/dashboard', items: [
                { text: 'Insights', link: '/dashboard/insights' },
                { text: 'Pipelines', link: '/dashboard/pipelines' },
                { text: 'Pull requests', link: '/dashboard/prs' },
                { text: 'Source code', link: '/dashboard/code' },
                { text: 'Configuration', link: '/dashboard/configuration' },
              ]
            },
          ]
        },
        {
          text: 'Integrations',
          items: [
            {
              text: 'GitHub', link: '/github', items: [
                { text: 'CLI', link: '/github/cli' },
                { text: 'Pull requests', link: '/github/cli-prs' },
                { text: 'Pipelines', link: '/github/cli-pipelines' },
              ]
            },
            {
              text: 'Codemaat', link: '/codemaat', items: [
                { text: 'CLI', link: '/codemaat/cli' },
              ]
            },
            {
              text: 'PyDriller', link: '/pydriller', items: [
                { text: 'CLI', link: '/pydriller/cli' },
              ]
            },
            {
              text: 'Tools', link: '/tools', items: [
                { text: 'CLI', link: '/tools/cli' },
              ]
            },
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
)

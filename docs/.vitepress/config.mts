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
      "window.dataLayer = window.dataLayer || [];  function gtag(){dataLayer.push(arguments);}  gtag('js', new Date());  gtag('config', '" + id + "',  { cookie_flags: 'Secure;SameSite=None' });",
    ]);
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Software metrics machine",
  description: "Stop pointing, start measuring",
  base: '/software-metrics-machine/',
  head,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is SMM', link: '/what-is-smm' },
        ]
      },
      {
        text: 'Integrations',
        items: [
          { text: 'GitHub', link: '/github' },
          { text: 'Codemaat', link: '/codemaat' },
          { text: 'GitLab', link: '/gitlab' }
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

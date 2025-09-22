import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Software metrics machine",
  description: "Stop pointing, start measuring",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
    ],

    sidebar: [
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
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})

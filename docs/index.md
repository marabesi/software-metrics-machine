---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Software metrics machine"
  text: "The place to visualize and analyze your sofware development process"
  tagline: Stop pointing, start measuring
  #https://www.flaticon.com/free-icon/data-analysis_12959231?term=dashboard&page=1&position=65&origin=search&related_id=12959231
  image: ./data-analysis.png
  actions:
    - theme: brand
      text: Getting started
      link: /getting-started
    - theme: alt
      text: What is Software Metrics Machine?
      link: /what-is-smm
features:
  - title: Privacy first 🔐
    details: This tool is designed to run locally, ensuring that your data remains private and secure never leaving your environment.
    link: ./privacy-first.md
  - title: Integrates with your source control version 🧑🏼‍💻
    link: ./supported-providers.md
    details: GitHub, GitLab, Bitbucket
  - title: One image is worth a thousand words 📊
    details: Visualize your data with interactive charts and graphs that make it easy to understand complex metrics at a glance.
    link: ./dashboard.md
  - title: Developer notes 🛠️
    details: Guidance for contributors on where to implement data aggregation vs visualization (repository vs view).
    link: ./dashboard/prs.md#developer-notes-recent-changes

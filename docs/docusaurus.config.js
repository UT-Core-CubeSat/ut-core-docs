// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'UT-CORE Docs',
  tagline: 'Modular, mission-agnostic CubeSat bus + software stack (Utah Tech)',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://ut-core-cubesat.github.io',
  baseUrl: '/ut-core-docs/',

  organizationName: 'ut-core-cubesat',
  projectName: 'ut-core-docs',

  // GitHub Pages: this helps avoid trailing slash weirdness
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/', // ✅ docs live at site root (homepage becomes docs)
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/ut-core-cubesat/ut-core-docs/edit/main/docs/',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
        },

        // ✅ If you don't want a blog, disable it
        blog: false,

        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/social-card.png', // make this later; safe if missing but better to add
      colorMode: {
        respectPrefersColorScheme: true,
        defaultMode: 'dark',
      },

      navbar: {
        title: 'UT-CORE',
        logo: {
          alt: 'UT-CORE',
          src: 'img/logo.svg',
        },
        items: [
          // With routeBasePath: '/', your docs are the site
          {type: 'docSidebar', sidebarId: 'tutorialSidebar', label: 'Docs', position: 'left'},
          {to: '/start-here', label: 'Start Here', position: 'left'},
          {to: '/architecture', label: 'Architecture', position: 'left'},

          {
            href: 'https://github.com/ut-core-cubesat/ut-core-docs',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },

      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {label: 'Start Here', to: '/start-here'},
              {label: 'Architecture', to: '/architecture'},
              {label: 'Interfaces (ICDs)', to: '/interfaces'},
              {label: 'Test & Verification', to: '/test-verification'},
            ],
          },
          {
            title: 'Project',
            items: [
              {label: 'Repository', href: 'https://github.com/ut-core-cubesat'},
              // Add more later (issue tracker, main firmware repo, etc.)
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Utah Tech UT-CORE.`,
      },

      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};
//lll
export default config;
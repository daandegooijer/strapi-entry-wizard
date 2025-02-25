import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import DropzoneModal from './components/Modal';
import { Magic } from '@strapi/icons';

export default {
  register(app: any) {
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });

    app.createSettingSection(
      {
        id: 'entry-wizard',
        intlLabel: {
          id: 'entry-wizard.title',
          defaultMessage: 'Entry Wizard',
        },
        category: 'plugins',
      },
      [
        {
          id: 'entry-wizard-settings',
          intlLabel: {
            id: 'entry-wizard.settings',
            defaultMessage: 'Settings',
          },
          to: '/plugins/entry-wizard/settings',
          Component: async () => import('./pages/Settings'),
        },
      ]
    );
  },

  bootstrap(app: any) {
    app.getPlugin('content-manager').injectComponent('listView', 'actions', {
      name: 'entry-wizard-button',
      Component: DropzoneModal,
    });
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);

          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  },
};

export default {
  async getSettings() {
    const pluginStore = strapi.store({ type: 'plugin', name: 'entry-wizard' });
    return (await pluginStore.get({ key: 'settings' })) || {};
  },

  async updateSettings(newSettings) {
    const pluginStore = strapi.store({ type: 'plugin', name: 'entry-wizard' });
    return await pluginStore.set({ key: 'settings', value: newSettings });
  },
};

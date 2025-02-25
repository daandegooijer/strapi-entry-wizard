import settingsService from '../services/settingsService';

export default {
  async getSettings(ctx) {
    try {
      const settings = await settingsService.getSettings();
      ctx.send(settings);
    } catch (error) {
      ctx.throw(500, 'Error retrieving settings');
    }
  },

  async updateSettings(ctx) {
    try {
      const newSettings = ctx.request.body;
      const updatedSettings = await settingsService.updateSettings(newSettings);
      ctx.send(updatedSettings);
    } catch (error) {
      ctx.throw(500, 'Error updating settings');
    }
  },
};

export default {
  admin: {
    type: 'admin',
    routes: [
      {
        method: 'POST',
        path: '/analyze-document',
        handler: 'entryController.analyzeAndCreate',
        config: {
          policies: ['admin::isAuthenticatedAdmin'],
        },
      },
      {
        method: 'GET',
        path: '/settings',
        handler: 'settingsController.getSettings',
        config: { policies: [] },
      },
      {
        method: 'POST',
        path: '/settings',
        handler: 'settingsController.updateSettings',
        config: { policies: [] },
      },
    ],
  },
};

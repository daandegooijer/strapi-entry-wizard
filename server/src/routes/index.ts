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
    ],
  },
};

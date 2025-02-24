export default [
  {
    method: 'POST',
    path: '/analyze-document',
    handler: 'entryController.analyzeAndCreate',
    config: {
      policies: [],
      middlewares: [],
    },
  },
];

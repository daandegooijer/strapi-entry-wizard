// import contentAPIRoutes from './content-api';
//
// const routes = {
//   'content-api': {
//     type: 'content-api',
//     routes: contentAPIRoutes,
//   },
// };

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

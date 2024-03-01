const config = require('config');

module.exports = {
  // Configurations available only to the backend
  serverRuntimeConfig: {},

  // Configurations available for both front and back ends
  publicRuntimeConfig: {
    infuraUrl: config.get('infuraUrl'),
  },
};

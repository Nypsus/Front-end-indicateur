const webpack = require('webpack');

module.exports = {
  webpack: (config, env) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      util: require.resolve('util/'),
      assert: require.resolve('assert/'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'), // Ajouter le polyfill pour Buffer
    };

    // Ajoute un plugin pour définir Buffer globalement
    config.plugins = [
      ...config.plugins,
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
    ];

    return config;
  },
};

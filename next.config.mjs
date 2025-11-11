/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile packages that use ESM
  transpilePackages: ['@imgly/background-removal'],

  webpack: (config, { isServer }) => {
    // Handle WASM files - set to use asset/resource to create separate files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/wasm/[name][ext]',
      },
    });

    // Add rule to handle .mjs files from onnxruntime
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    // Exclude ONNX Runtime node version from client bundle
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-node': false,
      };
    }

    // Ignore specific warnings from onnxruntime
    config.ignoreWarnings = [
      { module: /node_modules\/onnxruntime-web/ },
      { module: /node_modules\/@imgly\/background-removal/ },
    ];

    return config;
  },

  // Ensure WASM files are served correctly as static assets
  staticPageGenerationTimeout: 1000,
};

export default nextConfig;

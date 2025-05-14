/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {

    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        canvas: false,
      };
      

      config.module.rules.push({
        test: /\.(wasm)$/i,
        type: 'javascript/auto',
        loader: 'ignore-loader',
      });
      

      config.module.rules.push({
        test: /pdf\.worker\.(min\.)?(m)?js/,
        loader: 'file-loader',
        options: {
          name: 'static/[name].[hash].[ext]',
          publicPath: '/_next/',
        },
      });
    }

    return config;
  },

  transpilePackages: ['pdfjs-dist'],
};

module.exports = nextConfig; 
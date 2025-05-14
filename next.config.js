/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Отключаем проверку ESLint при сборке
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Чтобы убедиться, что pdf.worker доступен для клиентской сборки
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        canvas: false,
      };
      
      // Полностью исключаем загрузку WASM файлов
      config.module.rules.push({
        test: /\.(wasm)$/i,
        type: 'javascript/auto',
        loader: 'ignore-loader',
      });
      
      // Исключаем импорт worker файлов
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
  // Разрешаем импорт worker.mjs файлов
  transpilePackages: ['pdfjs-dist'],
};

module.exports = nextConfig; 
import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'

export default defineConfig(({ command }) => {
  const apiProxyTarget = process.env.API_PROXY_TARGET ?? process.env.PUBLIC_API_BASE

  return {
    plugins: [pluginReact()],
    source: {
      entry: {
        index: './src/main.tsx',
      },
      define: {
        __ENABLE_TEMPLATE_ROUTES__: command === 'dev',
      },
      transformImport: [
        {
          libraryName: 'lodash',
          customName: 'lodash/{{ member }}',
        },
      ],
    },
    html: {
      template: './index.html',
    },
    resolve: {
      alias: {
        '@': './src',
      },
    },
    output: {
      legalComments: 'none',
    },
    server: {
      proxy: {
        ...(apiProxyTarget
          ? {
              '/api': {
                target: apiProxyTarget,
                changeOrigin: true,
                secure: false,
                pathRewrite: {
                  '^/api': '',
                },
              },
            }
          : {}),
      },
    },
    performance: {
      chunkSplit: {
        strategy: 'custom',
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 550000,
          minChunks: 2,
          maxAsyncRequests: 20,
          maxInitialRequests: 30,
          cacheGroups: {
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 30,
              enforce: true,
            },
            antd: {
              test: /[\\/]node_modules[\\/](antd|@ant-design|rc-.*)[\\/]/,
              name: 'antd',
              chunks: 'all',
              priority: 25,
              enforce: true,
              maxSize: 3_000_000,
            },
            charts: {
              test: /[\\/]node_modules[\\/](echarts|echarts-for-react)[\\/]/,
              name: 'charts',
              chunks: 'all',
              priority: 23,
              enforce: true,
              maxSize: 3_000_000,
            },
            hooks: {
              test: /[\\/]node_modules[\\/]ahooks[\\/]/,
              name: 'hooks',
              chunks: 'all',
              priority: 22,
              enforce: true,
            },
            utils: {
              test: /[\\/]node_modules[\\/](lodash|dayjs|axios|axios-cache-interceptor|classnames|js-cookie)[\\/]/,
              name: 'utils',
              chunks: 'all',
              priority: 20,
              enforce: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              chunks: 'all',
              priority: 10,
            },
            common: {
              minChunks: 2,
              name: 'common',
              chunks: 'all',
              priority: 5,
            },
          },
        },
      },
    },
  }
})

import { defineConfig } from '@rspack/cli';
import { ModuleFederationPlugin, createModuleFederationConfig } from '@module-federation/enhanced/rspack';
import * as rspack from '@rspack/core';
import path from 'path';

export default defineConfig({
  mode: 'development',
  entry: './src/index',
  output: {
    uniqueName: 'mind',
    publicPath: 'auto',
    library: { type: 'module' },
    environment: { module: true },
  },
  plugins: [
    new rspack.HtmlRspackPlugin({ template: './public/index.html', scriptLoading: 'module' }),
    new ModuleFederationPlugin(
      createModuleFederationConfig({
        name: 'mind',
        shared: {
          react: { singleton: true, eager: true, requiredVersion: '^18' },
          'react-dom': { singleton: true, eager: true, requiredVersion: '^18' },
        },
        shareStrategy: 'loaded-first',
        dts: false,
        dev: true,
        runtimePlugins: [],
        bridge: { enableBridgeRouter: false },
      }),
    ),
  ],
});

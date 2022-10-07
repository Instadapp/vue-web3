import {
  addAutoImport,
  addImportsDir,
  defineNuxtModule,
  extendViteConfig,
} from '@nuxt/kit'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import rollupNodePolyFill from 'rollup-plugin-node-polyfills'

export interface ModuleOptions {
  autoImport: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'vue-web3',
    configKey: 'web3',
  },
  defaults: {
    autoImport: true,
  },
  setup(options, nuxt) {
    // nuxt.hook('vite:extendConfig', (clientConfig, { isClient }) => {
    //   if (isClient && process.env.NODE_ENV === 'production') {
    //     clientConfig.resolve.alias = {
    //       ...clientConfig.resolve.alias,
    //       web3: resolve('./node_modules/web3/dist/web3.min.js')
    //     }
    //   }
    // })

    extendViteConfig((config) => {
      config.build = config.build || {}
      config.build.rollupOptions = config.build.rollupOptions || {}
      config.build.rollupOptions.plugins =
        config.build.rollupOptions.plugins || []
      config.build.rollupOptions.plugins.push(rollupNodePolyFill())

      config.optimizeDeps = config.optimizeDeps || {}
      config.optimizeDeps.esbuildOptions =
        config.optimizeDeps.esbuildOptions || {}
      config.optimizeDeps.esbuildOptions.define =
        config.optimizeDeps.esbuildOptions.define || {}
      config.optimizeDeps.esbuildOptions.define.global = 'globalThis'

      config.optimizeDeps.esbuildOptions.plugins =
        config.optimizeDeps.esbuildOptions.plugins || []
      config.optimizeDeps.esbuildOptions.plugins.push(
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
      )
    })

    if (options.autoImport) {
      addAutoImport({
        name: 'useWeb3',
        from: '@instadapp/vue-web3',
      })
    }
  },
})

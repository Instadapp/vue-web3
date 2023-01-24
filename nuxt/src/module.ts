import { addImports, addVitePlugin, defineNuxtModule } from '@nuxt/kit'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

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
    addVitePlugin(nodePolyfills())

    if (options.autoImport) {
      addImports({
        name: 'useWeb3',
        from: '@instadapp/vue-web3',
      })
    }
  },
})

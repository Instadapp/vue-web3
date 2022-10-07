# @instadapp/vue-web3

Vue 2/3 wrapper for web3 built on top of [react-web3@v6](https://github.com/NoahZinsmeister/web3-react/tree/v6).

## 🚀 Quick Start

Install:

```bash
# npm
npm i @instadapp/vue-web3

# yarn
yarn add @instadapp/vue-web3
```

Usage:

```js
import { useWeb3, setWeb3LibraryCallback } from '@instadapp/vue-web3'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'

import Web3 from 'web3'

const injected = new InjectedConnector({
  supportedChainIds: [1, 137],
})

const walletconnect = new WalletConnectConnector({
  rpc: { 1: 'https://mainnet.infura.io/v3/YOUR_API_KEY' },
  qrcode: true,
})

setWeb3LibraryCallback((provider) => new Web3(provider))

defineComponent({
  setup() {
    const { active, activate, account, library } = useWeb3()

    const connectUsingMetamask = async () => {
      await activate(injected)
    }

    const connectUsingWalletConnect = async () => {
      await activate(walletconnect)
    }

    return {
      active,
      connect,
      connectUsingMetamask,
      connectUsingWalletConnect,
    }
  },
})
```
Typescript:

```js
import Web3 from 'web3'

const { library } = useWeb3<Web3>()
```

```js
import { Web3Provider } from "@ethersproject/providers";

const { library } = useWeb3<Web3Provider>()
```
Nuxt 3

```bash
yarn add @instadapp/vue-web3-nuxt -D
```

```ts
export default defineNuxtConfig({
    modules: [
        '@instadapp/vue-web3-nuxt'
    ],
})
```

<br />
---
<br />

Demo (Nuxt 2): https://github.com/KABBOUCHI/nuxt-vue-web3

Demo (Nuxt 3): https://github.com/KABBOUCHI/nuxt3-vue-web3

<template>
  <div class="relative p-10 n-bg-base">
    <div class="container w-full mx-auto flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <div class="text-4xl">
          Web3 + Nuxt
        </div>
      </div>

      <NCard class="p4">
        <pre>{{ {account, active, error} }}</pre>
      </NCard>

      <NCard class="p4 flex gap-4">
        <NButton @click="connectMetamask">
          Connect using MetaMask
        </NButton>

        <NButton @click="connectWalletConnect">
          Connect using WalletConnect
        </NButton>
      </NCard>
    </div>
  </div>
</template>

<script setup>
const { active, account, activate, error } = useWeb3()

const connectMetamask = async () => {
  const { InjectedConnector } = await import('@web3-react/injected-connector')

  await activate(
    new InjectedConnector({})
  )
}

const connectWalletConnect = async () => {
  const { WalletConnectConnector } = await import('@web3-react/walletconnect-connector')

  await activate(
    new WalletConnectConnector({})
  )
}
</script>

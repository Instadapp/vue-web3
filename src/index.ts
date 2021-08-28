import { AbstractConnector } from '@web3-react/abstract-connector'
import { normalizeAccount, normalizeChainId } from './normalizers'
import { ConnectorUpdate } from '@web3-react/types'
import { computed, ref, watch } from 'vue-demi'

class UnsupportedChainIdError extends Error {
  public constructor(
    unsupportedChainId: number,
    supportedChainIds?: readonly number[],
  ) {
    super()
    this.name = this.constructor.name
    this.message = `Unsupported chain id: ${unsupportedChainId}. Supported chain ids are: ${supportedChainIds}.`
  }
}

const connector = ref<AbstractConnector>()
const chainId = ref()
const account = ref<null | string>()
const provider = ref<any>()
const error = ref<Error>()
const active = computed(
  () =>
    connector.value !== undefined &&
    chainId.value !== undefined &&
    account.value !== undefined &&
    !!!error.value,
)
const library = ref()

let getLibrary = (provider?: any, connector?: any) => () => null

export const setWeb3LibraryCallback = (
  cb: (provider?: any, connector?: any) => any,
) => {
  getLibrary = cb
}

export const useWeb3 = () => {
  const activate = async (
    c: AbstractConnector,
    onError?: (error: Error) => void,
    throwErrors: boolean = false,
  ) => {
    let activated = false

    try {
      const update = await c.activate().then((update) => {
        activated = true
        return update
      })

      const augmentedUpdate = await augmentConnectorUpdate(c, update)

      connector.value = c
      chainId.value = augmentedUpdate.chainId
      provider.value = augmentedUpdate.provider
      account.value = augmentedUpdate.account
    } catch (e) {
      error.value = e

      if (throwErrors) {
        activated && c.deactivate()
        throw e
      } else if (onError) {
        activated && c.deactivate()
        onError(e)
      }
    }
  }

  const deactivate = () => {
    connector.value?.deactivate()
  }

  watch([active, provider, connector, chainId], () => {
    library.value =
      active.value &&
      chainId.value !== undefined &&
      Number.isInteger(chainId.value) &&
      !!connector.value
        ? getLibrary(provider.value, connector.value)
        : undefined
  })

  return {
    library,
    active,
    activate,
    deactivate,
    connector,
    chainId,
    account,
    provider,
    error,
  }
}

async function augmentConnectorUpdate(
  connector: AbstractConnector,
  update: ConnectorUpdate,
): Promise<ConnectorUpdate<number>> {
  const provider =
    update.provider === undefined
      ? await connector.getProvider()
      : update.provider
  const [_chainId, _account] = (await Promise.all([
    update.chainId === undefined ? connector.getChainId() : update.chainId,
    update.account === undefined ? connector.getAccount() : update.account,
  ])) as [
    Required<ConnectorUpdate>['chainId'],
    Required<ConnectorUpdate>['account'],
  ]

  const chainId = normalizeChainId(_chainId)
  if (
    !!connector.supportedChainIds &&
    !connector.supportedChainIds.includes(chainId)
  ) {
    throw new UnsupportedChainIdError(chainId, connector.supportedChainIds)
  }
  const account = _account === null ? _account : normalizeAccount(_account)

  return { provider, chainId, account }
}

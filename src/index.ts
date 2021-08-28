import { AbstractConnector } from '@web3-react/abstract-connector'
import { normalizeAccount, normalizeChainId } from './normalizers'
import { ConnectorEvent, ConnectorUpdate } from '@web3-react/types'
import { computed, onBeforeUnmount, ref, watch } from 'vue-demi'

export class UnsupportedChainIdError extends Error {
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

let getLibrary: any = (provider?: any, connector?: any) => (): any => null

export const setWeb3LibraryCallback = (
  cb: (provider?: any, connector?: any) => any,
) => {
  getLibrary = cb
}

export const useWeb3 = () => {
  const onErrorCb = ref<(error: Error) => void>()

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
      error.value = undefined
      onErrorCb.value = onError
    } catch (e: any) {
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

    handleDeactivate()
  }

  const handleUpdate = async (update: ConnectorUpdate): Promise<void> => {
    provider.value = update.provider
    chainId.value =
      update.chainId === undefined
        ? undefined
        : normalizeChainId(update.chainId)
    account.value =
      typeof update.account === 'string'
        ? normalizeAccount(update.account)
        : update.account
  }

  const handleError = (e: Error): void => {
    error.value = e

    if (onErrorCb.value) {
      onErrorCb.value(e)
    }

    active && connector.value?.deactivate()

    handleDeactivate()
  }

  const handleDeactivate = (): void => {
    connector.value = undefined

    chainId.value = undefined
    provider.value = undefined
    account.value = undefined
    library.value = undefined
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

  watch(
    connector,
    () => {
      if (connector.value) {
        connector.value
          .on(ConnectorEvent.Update, handleUpdate)
          .on(ConnectorEvent.Error, handleError)
          .on(ConnectorEvent.Deactivate, handleDeactivate)
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (connector.value) {
      connector.value
        .off(ConnectorEvent.Update, handleUpdate)
        .off(ConnectorEvent.Error, handleError)
        .off(ConnectorEvent.Deactivate, handleDeactivate)
    }
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

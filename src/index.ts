import { AbstractConnector } from '@web3-react/abstract-connector'
import { normalizeAccount, normalizeChainId } from './normalizers'
import { ConnectorEvent, ConnectorUpdate } from '@web3-react/types'
import {
  computed,
  onBeforeUnmount,
  Ref,
  ref,
  shallowRef,
  watch,
} from 'vue-demi'

export class UnsupportedChainIdError extends Error {
  public constructor(
    unsupportedChainId: number,
    supportedChainIds?: readonly number[],
  ) {
    super()
    this.name = 'UnsupportedChainIdError'
    this.message = `Unsupported chain id: ${unsupportedChainId}. Supported chain ids are: ${supportedChainIds}.`

    Object.setPrototypeOf(this, UnsupportedChainIdError.prototype)
  }
}

const connector = shallowRef<AbstractConnector>()
const chainId = ref()
const account = ref<null | string>()
const provider = shallowRef<any>()
const error = ref<Error>()
const active = computed(
  () =>
    connector.value !== undefined &&
    chainId.value !== undefined &&
    account.value !== undefined &&
    !!!error.value,
)
const library = shallowRef()

let getLibrary: any =
  (provider: any, connector: any, account: `0x${string}`) => (): any =>
    null

export const setWeb3LibraryCallback = (
  cb: (provider: any, connector: any, account: `0x${string}`) => any,
) => {
  getLibrary = cb
}

export interface IVueWeb3Library {
  [key: string]: any
}

export const useWeb3 = <TVueWeb3Library extends IVueWeb3Library>() => {
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
    if (error.value) {
      error.value = undefined
      return
    }

    if (!connector.value) {
      handleDeactivate()
      return
    }

    const cId =
      update.chainId === undefined
        ? undefined
        : normalizeChainId(update.chainId)

    if (
      cId !== undefined &&
      !!connector.value.supportedChainIds &&
      !connector.value.supportedChainIds.includes(cId)
    ) {
      const e = new UnsupportedChainIdError(
        cId,
        connector.value.supportedChainIds,
      )
      onErrorCb.value ? onErrorCb.value(e) : handleError(e)
      return
    }

    if (cId) {
      chainId.value = cId
    }

    if (update.provider) {
      provider.value = update.provider
    }

    const acc =
      typeof update.account === 'string'
        ? normalizeAccount(update.account)
        : update.account

    if (acc) {
      account.value = acc
    }
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

  watch([active, provider, connector, chainId, account], () => {
    library.value =
      active.value &&
      chainId.value !== undefined &&
      Number.isInteger(chainId.value) &&
      !!connector.value
        ? getLibrary(provider.value, connector.value, account.value)
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
    library: library as Ref<TVueWeb3Library>,
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

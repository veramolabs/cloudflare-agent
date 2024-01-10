// Core interfaces
import {
  createAgent,
  IDIDManager,
  IResolver,
  IDataStore,
  IDataStoreORM,
  IKeyManager,
  ICredentialPlugin,
} from '@veramo/core'

// Core identity manager plugin
import { DIDManager } from '@veramo/did-manager'

// Ethr did identity provider
import { EthrDIDProvider } from '@veramo/did-provider-ethr'

import { WebDIDProvider } from '@veramo/did-provider-web'

// Core key manager plugin
import { KeyManager } from '@veramo/key-manager'

// Custom key management system for RN
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local'

// W3C Verifiable Credential plugin
import { CredentialPlugin } from '@veramo/credential-w3c'

// Custom resolvers
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { Resolver } from 'did-resolver'
import { getResolver as ethrDidResolver } from 'ethr-did-resolver'
import { getResolver as webDidResolver } from 'web-did-resolver'

// Storing state as a JSON string in CloudFlare KV
import { KeyStoreJson, PrivateKeyStoreJson, DIDStoreJson } from '@veramo/data-store-json'
import { KVStore } from './lib/kv-data-store'

export const getAgent = async ({ namespace, infuraProjectId, kmsSecretKey }: {
  namespace: KVNamespace,
  infuraProjectId: string,
  kmsSecretKey: string,
}) => {

  const identifierDataStore = await KVStore.fromKey(namespace, 'veramo-id-state')

  const keyStore = new KeyStoreJson(identifierDataStore)
  const privateKeyStore = new PrivateKeyStoreJson(identifierDataStore, new SecretBox(kmsSecretKey))
  const didStore = new DIDStoreJson(identifierDataStore)

  return createAgent<
    IDIDManager & IKeyManager & IDataStore & IDataStoreORM & IResolver & ICredentialPlugin
  >({
    plugins: [
      new KeyManager({
        store: keyStore,
        kms: {
          local: new KeyManagementSystem(privateKeyStore),
        },
      }),
      new DIDManager({
        store: didStore,
        defaultProvider: 'did:ethr:goerli',
        providers: {
          'did:ethr:goerli': new EthrDIDProvider({
            defaultKms: 'local',
            network: 'goerli',
            rpcUrl: 'https://goerli.infura.io/v3/' + infuraProjectId,
          }),
          'did:web': new WebDIDProvider({
            defaultKms: 'local',
          }),
        },
      }),
      new DIDResolverPlugin({
        resolver: new Resolver({
          ...ethrDidResolver({ infuraProjectId }),
          ...webDidResolver(),
        }),
      }),
      new CredentialPlugin(),
    ],
  })
}

export const exposedMethods = ['resolveDid', 'didManagerGet', 'didManagerFind', 'keyManagerSign']

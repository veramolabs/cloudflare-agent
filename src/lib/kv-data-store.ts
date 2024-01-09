import { IIdentifier, IMessage, ManagedKeyInfo } from '@veramo/core-types'
import { ManagedPrivateKey } from '@veramo/key-manager'
import {
  DiffCallback,
  VeramoJsonCache,
  ClaimTableEntry,
  CredentialTableEntry,
  PresentationTableEntry,
  VeramoJsonStore,
} from '@veramo/data-store-json'

export class KVStore implements VeramoJsonStore {
  notifyUpdate: DiffCallback
  dids: Record<string, IIdentifier>
  keys: Record<string, ManagedKeyInfo>
  privateKeys: Record<string, ManagedPrivateKey>
  credentials: Record<string, CredentialTableEntry>
  claims: Record<string, ClaimTableEntry>
  presentations: Record<string, PresentationTableEntry>
  messages: Record<string, IMessage>

  private constructor(private kvNamespace: KVNamespace, private key: string) {
    this.notifyUpdate = async (
      oldState: VeramoJsonCache,
      newState: VeramoJsonCache,
    ) => {
      this.save(newState)
    }
    this.dids = {}
    this.keys = {}
    this.privateKeys = {}
    this.credentials = {}
    this.claims = {}
    this.presentations = {}
    this.messages = {}
  }

  public static async fromKey(namespace: KVNamespace, key: string): Promise<KVStore> {
    const store = new KVStore(namespace, key)
    return store.load()
  }

  private async load(): Promise<KVStore> {
      const rawCache = await this.kvNamespace.get(this.key) || '{}'
      let cache: VeramoJsonCache
      try {
        cache = JSON.parse(rawCache)
      } catch (e: any) {
        cache = {}
      }
      ({
        dids: this.dids,
        keys: this.keys,
        credentials: this.credentials,
        claims: this.claims,
        presentations: this.presentations,
        messages: this.messages,
        privateKeys: this.privateKeys,
      } = {
        dids: {},
        keys: {},
        credentials: {},
        claims: {},
        presentations: {},
        messages: {},
        privateKeys: {},
        ...cache,
      })

    return this
  }

  private async save(newState: VeramoJsonCache): Promise<void> {
      this.kvNamespace.put(this.key, JSON.stringify(newState))
  }

}

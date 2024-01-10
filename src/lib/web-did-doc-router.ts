import { IIdentifier, IDIDManager, TKeyType, IKey } from '@veramo/core-types'
import { bytesToBase58, bytesToMultibase, hexToBytes } from '@veramo/utils'
import { ServiceEndpoint, VerificationMethod } from 'did-resolver'
import { Hono } from 'hono'
import { ContextWithAgent } from './request-agent-router'


const keyMapping: Record<TKeyType, string> = {
  Secp256k1: 'EcdsaSecp256k1VerificationKey2019',
  Secp256r1: 'EcdsaSecp256r1VerificationKey2019',
  Ed25519: 'Ed25519VerificationKey2018',
  X25519: 'X25519KeyAgreementKey2019',
  Bls12381G1: 'Bls12381G1Key2020',
  Bls12381G2: 'Bls12381G2Key2020',
}

/**
 * @public
 */
export interface WebDidDocRouterOptions {
  /**
   * Create a Identifier if it does not exist
   */
  createMissingIdentifier?: boolean
  /**
   * Additional services to add to the DID Document
   */
  services?: ServiceEndpoint[]
}

/**
 * Creates a router that serves `did:web` DID Documents
 *
 * @param options - Initialization option
 * @returns Expressjs router
 *
 * @public
 */
export const WebDidDocRouter = (options: WebDidDocRouterOptions): Hono => {
  const router = new Hono()

  const didDocForIdentifier = (identifier: IIdentifier) => {
    const contexts = new Set<string>()
    const allKeys: VerificationMethod[] = identifier.keys.map((key: IKey) => {
      const vm: VerificationMethod = {
        id: identifier.did + '#' + key.kid,
        type: keyMapping[key.type],
        controller: identifier.did,
        publicKeyHex: key.publicKeyHex,
      }
      switch (vm.type) {
        case 'EcdsaSecp256k1VerificationKey2019':
        case 'EcdsaSecp256k1RecoveryMethod2020':
          contexts.add('https://w3id.org/security/v2')
          contexts.add('https://w3id.org/security/suites/secp256k1recovery-2020/v2')
          break
        case 'Ed25519VerificationKey2018':
          contexts.add('https://w3id.org/security/suites/ed25519-2018/v1')
          vm.publicKeyBase58 = bytesToBase58(hexToBytes(key.publicKeyHex))
          delete (vm.publicKeyHex)
          break
        case 'X25519KeyAgreementKey2019':
          contexts.add('https://w3id.org/security/suites/x25519-2019/v1')
          vm.publicKeyBase58 = bytesToBase58(hexToBytes(key.publicKeyHex))
          delete (vm.publicKeyHex)
          break
        case 'Ed25519VerificationKey2020':
          contexts.add('https://w3id.org/security/suites/ed25519-2020/v1')
          vm.publicKeyMultibase = bytesToMultibase(hexToBytes(key.publicKeyHex), 'base58btc', 'ed25519-pub')
          delete (vm.publicKeyHex)
          break
        case 'X25519KeyAgreementKey2020':
          contexts.add('https://w3id.org/security/suites/x25519-2020/v1')
          vm.publicKeyMultibase = bytesToMultibase(hexToBytes(key.publicKeyHex), 'base58btc', 'x25519-pub')
          delete (vm.publicKeyHex)
          break
        case 'EcdsaSecp256r1VerificationKey2019':
          contexts.add('https://w3id.org/security/v2')
          break
        case 'Bls12381G1Key2020':
        case 'Bls12381G2Key2020':
          contexts.add('https://w3id.org/security/bbs/v1')
          break
        default:
          break
      }
      return vm
    })
    const keyAgreementKeyIds = allKeys
      .filter((key) => ['Ed25519VerificationKey2018', 'X25519KeyAgreementKey2019'].includes(key.type))
      .map((key) => key.id)
    const signingKeyIds = allKeys
      .filter((key) => key.type !== 'X25519KeyAgreementKey2019')
      .map((key) => key.id)

    const didDoc = {
      '@context': ['https://www.w3.org/ns/did/v1', ...contexts],
      id: identifier.did,
      verificationMethod: allKeys,
      authentication: signingKeyIds,
      assertionMethod: signingKeyIds,
      keyAgreement: keyAgreementKeyIds,
      service: [...(options?.services || []), ...(identifier?.services || [])],
    }

    return didDoc
  }

  const getAliasForRequest = (c: ContextWithAgent<any>) => {
    return encodeURIComponent(c.req.header('host') || '')
  }

  router.get('/.well-known/did.json', async (c: ContextWithAgent<IDIDManager>) => {
    if (c.agent) {
      try {
        let serverIdentifier
        if (options.createMissingIdentifier) {
          serverIdentifier = await c.agent.didManagerGetOrCreate({
            alias: getAliasForRequest(c),
            provider: 'did:web',
          })
        } else {
          serverIdentifier = await c.agent.didManagerGet({
            did: 'did:web:' + getAliasForRequest(c),
          })
        }
        const didDoc = didDocForIdentifier(serverIdentifier)
        return c.json(didDoc)
      } catch (e: any) {
        return c.text(e.message, 404)
      }
    }
  })

  // TODO: Implement this
  // router.get('/:alias{.+}/did.json', async (c: ContextWithAgent<IDIDManager>) => {
  //   if (c.agent) {
  //     try {
  //       const identifier = await c.agent.didManagerGet({
  //         did: 'did:web:' + getAliasForRequest(c) + ':' + c.req.param('alias').replace(/\//g, ':'),
  //       })
  //       const didDoc = didDocForIdentifier(identifier)
  //       return c.json(didDoc)
  //     } catch (e: any) {
  //       return c.text(e.message, 404)
  //     }
  //   }
  // })

  return router
}

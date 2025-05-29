// UCAN generation/validation
// https://docs.storacha.network/concepts/ucans-and-storacha/

import * as UCAN from '@ucanto/core';
import * as Signer from '@ucanto/principal/ed25519';
import { CarReader } from '@ipld/car'
import * as DID from '@ipld/dag-ucan/did'
import * as Delegation from '@ucanto/core/delegation'
import { initStorachaClient } from './storacha';
import * as Client from '@web3-storage/w3up-client'
import { StoreMemory } from '@web3-storage/w3up-client/stores/memory'

const serviceDID = process.env.NEXT_PUBLIC_STORACHA_SERVICE_DID || '';

export const generateUCAN = async ({audience, cid, expiresInSeconds, usageLimit}) => {
  const issuer = await Signer.generate();
  const expiration = Math.floor(Date.now() / 1000) + expiresInSeconds;

  const ucan = await UCAN.delegate({
    issuer,
    audience: UCAN.DID.parse(audience),
    capabilities: [{
      with: `storage://${cid}`,
      can: 'access/secret',
      nb: {
        usage: usageLimit,
        expiration
      }
    }],
    expiration
  });

  return UCAN.encode(ucan);
};

export const ucanDelegate = async ({ issuer, capabilities }) => {
    // Create a delegation for a specific DID
  const audience = DID.parseLink(did)
  const client= await initStorachaClient();
  if (!client) {  
    throw new Error('Failed to initialize Storacha client');
  }
  const abilities = ['space/blob/add', 'space/index/add', 'filecoin/offer', 'upload/add']
  const expiration = Math.floor(Date.now() / 1000) + (60 * 60 * 24) 
  const delegation = await client.createDelegation(audience, abilities, { expiration })
 
  // Serialize the delegation and send it to the client
  const archive = await delegation.archive()
  return archive.ok
}
 
/** @param {string} data Base64 encoded CAR file */
async function parseProof(data) {
  const blocks = []
  const reader = await CarReader.fromBytes(Buffer.from(data, 'base64'))
  for await (const block of reader.blocks()) {
    blocks.push(block)
  }
  return Delegation.importDAG(blocks)
}

export const validateUCAN = async (token, cid) => {
  const decoded = await UCAN.parseLink(token);
  const valid = await UCAN.verify(decoded, {
    audience: UCAN.DID.parseLink(serviceDID),
    capability: {
      with: `storage://${cid}`,
      can: 'access/secret'
    },
    issuer: decoded.issuer
  });
  return valid.ok;
};


export const decodeUCAN = async (token) => {
    try {
        const decoded = await UCAN.parseLink(token);
        return {
        issuer: decoded.issuer.toString(),
        audience: decoded.audience.toString(),
        capabilities: decoded.capabilities.map(cap => ({
            with: cap.with.toString(),
            can: cap.can,
            nb: cap.nb
        })),
        expiration: decoded.expiration
        };
    } catch (error) {
        console.error("Error decoding UCAN:", error);
        throw new Error("Invalid UCAN token");
    }
    }

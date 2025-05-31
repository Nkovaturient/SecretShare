import { CarReader } from '@ipld/car'
import * as DID from '@ipld/dag-ucan/did'
import * as Delegation from '@ucanto/core/delegation'
import { initStorachaClient } from './storacha';
import { decode } from '@ipld/dag-ucan';


export const createUCANDelegation = async ({
  recipientDID,
  expiresInMinutes = 10,
  usageLimit = 1,
}) => {
  try {
    const client = await initStorachaClient();
    const expiration = Math.floor(Date.now() / 1000) + expiresInMinutes * 60;
    const spaceDID = client.agent.did();
    const audience = DID.parse(recipientDID);
    const agent = client.agent;

    const ucan = await Delegation.delegate({
      issuer: agent.issuer,
      audience,
      capabilities: [{
        with: `${spaceDID}`,
        can: 'access/secret',
        nb: {
          usage: usageLimit,
          expiration,
        },
      }],
    })
    const cid = await ucan.cid;
    console.log('UCAN CID:', cid);

    console.log('Issuer DID:', agent.did())
    console.log('Audience DID:', recipientDID)
    console.log('Space DID:', spaceDID)
    const archive = await ucan.archive();

    if (!archive.ok) {
      throw new Error('Failed to create delegation archive');
    }

    // console.log('Delegation archive created successfully', archive.ok);
    return archive.ok
  } catch (err) {
    console.error('Error creating UCAN delegation:', err);
    throw err;
  }
};


export async function validateAccess(encodedDelegation) {
  try {
    const buffer = Buffer.from(encodedDelegation, 'base64');
    const delegation = await Delegation.extract(buffer);
    if (!delegation.ok) {
      return { valid: false, reason: 'invalid' }
    }
    const capability = delegation.ok.capabilities()[0];

    // Checking expiry and usage
    const now = Math.floor(Date.now() / 1000);
    if (now > capability.nb.expiration) {
      console.warn('UCAN delegation has expired');
      return { valid: false, reason: 'expired' };
    }

    return {
      valid: true,
      expiration: capability.nb.expiration,
      remainingUses: capability.nb.usage
    };
  } catch (err) {
    return { valid: false, reason: 'invalid' };
  }
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

export async function decodeUCAN(encoded) {
  try {
    const bytes = Buffer.from(encoded, 'base64');
    const reader = await CarReader.fromBytes(bytes);

    const blocks = [];
    for await (const block of reader.blocks()) {
      blocks.push(block);
    }

    const delegation = await Delegation.importDAG(blocks);

    const cap = delegation.capabilities()[0];
    const exp = cap.nb?.expiration || 0;
    const now = Math.floor(Date.now() / 1000);

    return {
      isValid: exp > now,
      cid: cap.with.split('storage://')[1],
      usage: cap.nb?.usage,
      expiration: exp
    };
  } catch (err) {
    console.error('Error decoding UCAN:', err);
    return { isValid: false };
  }
}

export async function validateUCAN(encoded) {
  try {
    // 1. Import the UCAN as a delegation
    const blocks = await Delegation.extract(encoded)

    if (!blocks || blocks.length === 0) {
      return { isValid: false }
    }

    const delegation = await decode(blocks[0])

    // 2. Get the invocation/claim data
    const capabilities = [...delegation.capabilities()]
    const cap = capabilities[0]

    if (!cap) return { isValid: false }

    // 3. Extract facts and constraints
    const cid = cap.nb?.cid
    const iv = cap.nb?.iv
    const exp = cap.expiry || 0
    const now = Math.floor(Date.now() / 1000)

    if (!cid || !iv || exp < now) {
      return { isValid: false }
    }

    return {
      isValid: true,
      cid,
      iv,
      expiration: exp,
    }

  } catch (error) {
    console.error('UCAN validation error:', error)
    return { isValid: false }
  }
}

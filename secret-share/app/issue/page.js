'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { InputField } from '@/components/InputField'
import { ShieldCheck, Clock, Users } from 'lucide-react'
import { uploadFileToStoracha } from '@/lib/storacha'
import * as Delegation from '@ucanto/core/delegation'
import {createUCANDelegation } from '@/lib/ucan'
import Link from 'next/link'
import * as Client from '@web3-storage/w3up-client'
import { SecretStorage } from '@/lib/secretRecord'


export default function IssueSecretPage() {
  const router = useRouter()

  const [secret, setSecret] = useState('')
  const [expiry, setExpiry] = useState(10) // in mins
  const [usageLimit, setUsageLimit] = useState(1)
  const [recipient, setRecipient] = useState('')
  const [loading, setLoading] = useState(false)
  const [shareLink, setShareLink] = useState('')

  const triggerDelegation = async () => {
    try {
      const encodedUCAN = await createUCANDelegation({
        recipientDID: recipient,
        expiresInMinutes: expiry,
        usageLimit
      });

      const delegationBytes = Buffer.from(encodedUCAN, 'base64')
      const delegation = await Delegation.extract(delegationBytes)
      if (!delegation.ok) throw new Error('UCAN extract failed')

      console.log('Delegation verified successfully:', delegation.ok)

      const client = await Client.create()
      const space = await client.addSpace(delegation.ok)
      client.setCurrentSpace(space.did())
      return delegation.ok

    }
    catch (error) {
      console.error('Error triggering delegation:', error)
      return false
    }
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const delegate = await triggerDelegation()
      console.log('Delegation verified:', delegate)

      const BlobData = new Blob([JSON.stringify({ secret, recipient, expiry, usageLimit })], { type: 'application/json' })
      const data = new File([BlobData], `secret-${Date.now()}.json`, {
        type: 'application/json',
        lastModified: Date.now(),
      })

      const uploadSecret = await uploadFileToStoracha(data)
      if (!uploadSecret) {
        throw new Error('Failed to upload secret data to Storacha')
      }
      console.log('Data uploaded successfully, CID:', uploadSecret)

      setShareLink(`${uploadSecret.url}`)

      SecretStorage.addSecret({
        secret: secret.substring(0, 15) + '...',
        shareLink: shareLink,
        recipient,
        expiry: new Date(Date.now() + expiry * 60000).toISOString(),
        usageLimit,
        usage: 0,
        cid: uploadSecret.cid
      })

    } catch (err) {
      console.error('Error sharing secret:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 mb-10 px-4">
      <h1 className="text-3xl font-bold text-center text-[#1e3551] mb-6">🔐 Share a Secret</h1>
      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-2xl shadow-xl border border-gray-200">

        <InputField
          label="Secret"
          placeholder="Enter your API Key or password..."
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          icon={<ShieldCheck className="w-4 h-4" />}
        />

        <InputField
          label="Recipient Agent DID"
          placeholder="did:key:z..."
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          icon={<Users className="w-4 h-4" />}
        />

        <InputField
          label="Expiry Time (mins)"
          type="number"
          value={expiry}
          onChange={(e) => setExpiry(Number(e.target.value))}
          icon={<Clock className="w-4 h-4" />}
        />

        <InputField
          label="Usage Limit"
          type="number"
          value={usageLimit}
          onChange={(e) => setUsageLimit(Number(e.target.value))}
        />
        <button
          type="submit"
          className={`w-full py-2 px-4 mb-6 mt-6 rounded-lg text-white font-semibold ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1e3551] hover:bg-[#15283d]'
            }`}
          disabled={loading}
        >
          {loading ? '🚀Seconds to Storacha🔥...' : 'Upload & Share'}
        </button>
      </form>

      {shareLink && (
        <div className="mt-6 p-4 mb-8 bg-green-100 text-green-800 rounded-xl border border-green-300">
          ✅ Secret Shared! Copy your link: <br />
          <Link
            href={shareLink}
            className="text-blue-600 underline break-words"
            target="_blank"
          >
            {shareLink}
          </Link>
        </div>
      )}
    </div>
  )
}

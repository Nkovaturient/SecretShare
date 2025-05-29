'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { InputField } from '@/components/InputField'
import { ShieldCheck, Clock, Users } from 'lucide-react'
import { uploadFileToStoracha } from '@/lib/storacha'
import { generateUCAN } from '@/lib/ucan'
import Link from 'next/link'

export default function IssueSecretPage() {
  const router = useRouter()

  const [secret, setSecret] = useState('')
  const [expiry, setExpiry] = useState(10) // in minutes
  const [usageLimit, setUsageLimit] = useState(1)
  const [recipient, setRecipient] = useState('')
  const [loading, setLoading] = useState(false)
  const [shareLink, setShareLink] = useState('')

  // upload necessary user input data into BlobLike File to storacha
  const BlobData = new Blob([JSON.stringify({ secret, recipient, expiry, usageLimit })], { type: 'application/json' })
  const data = new File([BlobData], `secret-${Date.now()}.json`, {
    type: 'application/json',
    lastModified: Date.now(),
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const cid = await uploadFileToStoracha(data)
      if (!cid) {
        throw new Error('Failed to upload secret data to Storacha')
      }
      console.log('Data uploaded successfully, CID:', cid)

      const ucan = await generateUCAN({
        cid,
        expiryMinutes: expiry,
        usageLimit,
        recipientDID: recipient,
        iv,
      })

      setShareLink(`${window.location.origin}/share/${encodeURIComponent(ucan)}`)
    } catch (err) {
      console.error('Error sharing secret:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4">
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
          label="Recipient DID"
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
          className="w-full py-2 bg-[#dcfe50] text-[#1e3551] font-semibold rounded-xl hover:bg-[#c1ec3f] transition"
          disabled={loading}
        >
          {loading ? 'Encrypting & Uploading...' : 'Generate Share Link'}
        </button>
      </form>

      {shareLink && (
        <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-xl border border-green-300">
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

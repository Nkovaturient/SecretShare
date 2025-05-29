# 🔐 SecretShare 🔃
- SecretShare is a secure way to delegate time-limited or usage-limited access to sensitive credentials, secrets, or API tokens without revealing them outright. It is like sharing 1-time access to an API key or password vault item without giving away full control.
   <!-- ![SecretShare Banner](public/banner.png)   -->

![Screenshot (595)](https://github.com/user-attachments/assets/01f40596-a7b5-4349-b92c-67690871075f)

---

## 📖 About

**SecretShare** empowers you to:
- 🔄 Share secrets like API keys **once** or for a **short duration**.
- 🕓 Limit access by **time or usage count**.
- 🧾 Delegate access **without transferring full ownership**.
- 📁 Store secrets securely via [Storacha](https://docs.storacha.network).
- 🪪 Leverage UCANs for secure, verifiable delegation.

> Think of it as "one-time vault links for devs and teams."

---

# Potentials and Features

**💡 1. Clear Problem-Solution Fit (10/10)**
- Addressing a painfully common devops/security issue: sharing secrets temporarily without leakage.
- Real-life scenario clarity: “10 minutes to access an API key” is simple, relatable, and urgent.
- Scoped UCANs as a mechanism is the perfect fit: decentralized, granular, and revocable.

**🛠️ 2. Use of Web3 Stack Appropriately (9.5/10)**
- Storacha + UCANs is not just hype here — they directly provide features traditional systems can’t.
- Use of DIDs, capability-based delegation, and CID-level scoping shows you're thinking security-first.

**🧑‍💻 3. Practical UX Thinking (9/10)**
- Password-protected access on top of UCANs shows real understanding of layered access security.
- Dashboards showing "who accessed when", and usage count = great for observability.
- Shareable links as an access mechanism = familiar UX, low friction for onboarding.

**🔐 4. Security-First Architecture (9.5/10)**
- Usage-limited + time-limited delegation = strong ephemeral access model.
- Secret not exposed until all checks pass.
- Great fit for compliance-heavy environments (finance, infra, health).


# File Flow with Storacha Integration

```
User Input (Secret/Note/API Key)
        |
        v
Encrypt File (AES or inbuilt)
        |
        v
Upload Encrypted File to Storacha (returns CID)
        |
        v
Issue UCAN -> Scoped to:
   - CID (secret)
   - Expiry
   - Usage limit
   - Recipient's DID
        |
        v
Share link: /share/[ucan]
        |
        v
User accesses → UCAN verified → File fetched from Storacha → Decrypted → Revealed once
```

---

<!-- ## 📽️ Live Demo

[🔗 Watch the 2-min demo on YouTube](https://youtu.be/demo-secretshare)  
[🌐 Try Live Now](https://secretshare.vercel.app)

--> 

## ⚙️ How It Works

1. **Issuer uploads secret to Storacha**
   - Simple text-based data (e.g., API keys, tokens)
   - Receives a CID after upload

2. **Generates UCAN delegation**
   - Specifies:
     - Recipient DID
     - Expiry time
     - Usage count (e.g., one-time use)
   - Delegation signed with issuer’s key

3. **Recipient visits `/share/[ucan]`**
   - UCAN is parsed and validated
   - If valid and not expired/used:
     - Retrieves and reveals secret
   - If invalid:
     - Displays "Access Denied"

---

## 🧰 Tech Stack

| Layer        | Stack                                      |
|--------------|--------------------------------------------|
| Frontend     | Next.js (App Router), TailwindCSS, Lucide  |
| SDK & Logic  | Storacha SDK, UCAN (`@ucanto/core`)        |
| State Mgmt   | React hooks, local state                   |
| Deployment   | Vercel                                     |

---

## 🚀 Quickstart

```bash
# 1. Clone the repo
git clone https://github.com/yourhandle/secretshare.git
cd secretshare

# 2. Install dependencies
npm install

# 3. Set environment variables
touch .env
# Add:
# NEXT_PUBLIC_STORACHA_PRIVATE_KEY=
# NEXT_PUBLIC_STORACHA_DELEGATION=

# 4. Run locally
npm run dev
```

Feel free to ping me in case of any issues or feedback! Happy coding! :rachaheart ♥🔥

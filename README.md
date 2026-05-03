# Grokzilla Premium — Pay with SOL

A Next.js app that gates premium features behind Solana payments (0.05 SOL per use).

Users connect their wallet, pay with SOL, and receive a premium random number. Payment is verified on-chain before access is granted.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Edit `.env.local`:

```env
SOLANA_RPC_URL=https://rpc.solanatracker.io/public
NEXT_PUBLIC_SOLANA_RPC_URL=https://rpc.solanatracker.io/public

AGENT_TOKEN_MINT_ADDRESS=9gVWKy8e1HsK8SpdwNg6eZrup864Gp493HbR2NuVpump
CURRENCY_MINT=So11111111111111111111111111111111111111112

PRICE_LAMPORTS=50000000

RECIPIENT_WALLET_ADDRESS=<YOUR_SOLANA_WALLET_ADDRESS>
```

**Get your wallet address:**
- Open Phantom or your Solana wallet
- Copy your public key (the long address starting with a letter)
- Paste it in `RECIPIENT_WALLET_ADDRESS`

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 4. Test Payment Flow

1. Click "Connect Wallet"
2. Select Phantom (or your wallet)
3. Approve the connection
4. Click "Generate Premium Number"
5. Sign the transaction
6. Payment is verified and the number is generated!

## How It Works

1. **User connects wallet** → Phantom/Slope/Ghost
2. **Clicks "Generate"** → Frontend builds a payment instruction using `@pump-fun/agent-payments-sdk`
3. **User signs transaction** → Confirms 0.05 SOL payment
4. **Payment sent to recipient** → SOL transferred on-chain
5. **Backend verifies** → Confirms payment was received via `validateInvoicePayment`
6. **Access granted** → Premium number generated and returned

## Key Files

- `pages/index.tsx` — Main UI (wallet connect, payment button, result display)
- `pages/api/verify-payment.ts` — Backend verification (CRITICAL for security)
- `pages/_app.tsx` — Solana wallet adapter setup
- `.env.local` — Configuration

## Security

⚠️ **NEVER trust the client alone!** Always verify payments on the backend before granting access.

The `verify-payment` API endpoint:
- Takes the `invoiceId` from the transaction
- Queries the blockchain to confirm payment was received
- Returns success/failure

Only after backend confirmation should the frontend grant access.

## Cost Analysis

**Per transaction:**
- 0.05 SOL to user (your revenue)
- ~0.00025 SOL network fee
- Total revenue per use: 0.04998 SOL (~$5 at current rates)

**Monthly (1000 uses):**
- Revenue: 49.98 SOL (~$5000)
- Costs: 0.25 SOL (~$25)
- Profit: 49.73 SOL (~$4975)

## Scaling

Later, add more premium features:
- `/premium/analyze` — Deep token analysis (0.05 SOL)
- `/premium/whale-track` — Whale monitoring (0.10 SOL)
- `/premium/thread-gen` — Alpha thread generation (0.02 SOL)
- `/premium/scanner` — Advanced pump.fun scanning (0.01 SOL)

All behind the same payment verification system.

## Support

- Docs: https://docs.pump.fun/agent-payments
- SDK: https://github.com/pump-fun/agent-payments-sdk
- Solana: https://solana.com/developers

---

**Built for Grokzilla 🦖**

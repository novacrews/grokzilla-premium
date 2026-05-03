import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { buildAcceptPaymentInstructions } from '@pump-fun/agent-payments-sdk';
import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import Head from 'next/head';
import styles from '../styles/Premium.module.css';

const PRICE_SOL = 0.05;
const PRICE_LAMPORTS = 50000000; // 0.05 SOL
const RECIPIENT_WALLET = '5arDworiTQnkRz6mhLheiB6E8QHT1bZ3CTHZLHJGqMeU';
const AGENT_MINT = '9gVWKy8e1HsK8SpdwNg6eZrup864Gp493HbR2NuVpump';
const RPC_URL = 'https://rpc.solanatracker.io/public';

export default function Premium() {
  const { publicKey, signTransaction, connected, connect } = useWallet();
  const { setVisible } = useWalletModal();
  const [loading, setLoading] = useState(false);
  const [randomNumber, setRandomNumber] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const generatePremiumNumber = useCallback(async () => {
    if (!publicKey || !signTransaction || !connected) {
      setVisible(true);
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const connection = new Connection(RPC_URL);
      const agentMintKey = new PublicKey(AGENT_MINT);
      const recipientWalletKey = new PublicKey(RECIPIENT_WALLET);

      // Generate invoice ID (random)
      const invoiceId = Math.floor(Math.random() * 1000000);

      // Build payment instructions
      const { instructions, signers } = await buildAcceptPaymentInstructions(
        connection,
        publicKey,
        agentMintKey,
        PRICE_LAMPORTS,
        invoiceId,
        recipientWalletKey
      );

      // Create transaction
      const { blockhash } = await connection.getLatestBlockhash();
      const tx = new Transaction({
        recentBlockhash: blockhash,
        feePayer: publicKey,
      });

      tx.add(...instructions);

      if (signers.length > 0) {
        tx.partialSign(...signers);
      }

      // Sign with wallet
      const signedTx = await signTransaction(tx);

      // Send transaction
      setMessage('🔄 Sending transaction...');
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature);

      setMessage('✅ Payment confirmed! Verifying...');

      // Verify on backend
      const verifyRes = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, agentMint: AGENT_MINT }),
      });

      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        // Generate premium random number
        const number = Math.floor(Math.random() * 1001);
        setRandomNumber(number);
        setMessage(`🎉 Premium number generated: ${number}`);
      } else {
        setError('Payment verification failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  }, [publicKey, signTransaction, connected, setVisible]);

  return (
    <>
      <Head>
        <title>Grokzilla Premium - Pay with SOL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <nav className={styles.nav}>
        <Link href="/">Home</Link>
        <Link href="/analyzer">Token Analyzer</Link>
      </nav>

      <main className={styles.container}>
        <div className={styles.card}>
          <h1>🦖 Grokzilla Premium</h1>
          <p className={styles.subtitle}>AI-Powered Solana Token Intelligence</p>

          <div className={styles.priceBox}>
            <span className={styles.price}>{PRICE_SOL} SOL</span>
            <span className={styles.priceLabel}>per generation</span>
          </div>

          {!connected ? (
            <button
              className={styles.buttonPrimary}
              onClick={() => setVisible(true)}
            >
              🔗 Connect Wallet
            </button>
          ) : (
            <>
              <div className={styles.walletInfo}>
                ✅ Connected: {publicKey?.toString().slice(0, 8)}...
              </div>

              <button
                className={styles.buttonPrimary}
                onClick={generatePremiumNumber}
                disabled={loading}
              >
                {loading ? '⏳ Processing...' : '🎲 Generate Premium Number'}
              </button>
            </>
          )}

          {message && <div className={styles.message}>{message}</div>}
          {error && <div className={styles.error}>❌ {error}</div>}

          {randomNumber !== null && (
            <div className={styles.resultBox}>
              <h2>Your Premium Number</h2>
              <div className={styles.number}>{randomNumber}</div>
              <p className={styles.range}>Between 0 and 1000</p>
            </div>
          )}

          <div className={styles.info}>
            <h3>Why Premium?</h3>
            <ul>
              <li>⚡ Instant generation</li>
              <li>🔐 On-chain verified</li>
              <li>💎 Exclusive access</li>
              <li>🎯 Pure randomness</li>
            </ul>
          </div>

          <div className={styles.footer}>
            <p>
              Powered by Solana • <a href="https://grokzilla.fun">Back to Grokzilla</a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

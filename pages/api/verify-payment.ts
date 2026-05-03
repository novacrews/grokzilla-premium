import { validateInvoicePayment, getInvoiceIdPDA } from '@pump-fun/agent-payments-sdk';
import { Connection, PublicKey } from '@solana/web3.js';
import { NextApiRequest, NextApiResponse } from 'next';

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://rpc.solanatracker.io/public';
const AGENT_TOKEN_MINT_ADDRESS = process.env.AGENT_TOKEN_MINT_ADDRESS || '';
const PRICE_LAMPORTS = parseInt(process.env.PRICE_LAMPORTS || '50000000');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { invoiceId } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ error: 'invoiceId is required' });
    }

    const connection = new Connection(SOLANA_RPC_URL);
    const agentMint = new PublicKey(AGENT_TOKEN_MINT_ADDRESS);

    // Get the invoice PDA
    const invoicePda = await getInvoiceIdPDA(
      agentMint,
      parseInt(invoiceId)
    );

    // Validate the payment
    const isValid = await validateInvoicePayment(
      connection,
      agentMint,
      PRICE_LAMPORTS,
      invoicePda
    );

    if (isValid) {
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        invoiceId
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify payment'
    });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';

interface TokenAnalysis {
  success: boolean;
  token?: {
    mint: string;
    name: string;
    symbol: string;
    price: number;
    volume24h: number;
    liquidity: number;
    marketCap: number;
  };
  holders?: {
    total: number;
    top10Percentage: number;
    topHolders: Array<{
      address: string;
      amount: number;
      percentage: number;
    }>;
  };
  safety?: {
    score: number;
    risks: string[];
    greenFlags: string[];
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TokenAnalysis>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { mint } = req.body;
  if (!mint) {
    return res.status(400).json({ success: false, error: 'Token mint required' });
  }

  try {
    // Fetch from DexScreener
    const dexRes = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${mint}`
    );
    const dexData = await dexRes.json();

    if (!dexData.pairs || dexData.pairs.length === 0) {
      return res.status(200).json({
        success: false,
        error: 'Token not found on DexScreener'
      });
    }

    const pair = dexData.pairs[0];

    // Fetch holder data from Solscan
    let holderInfo = { total: 0, top10: 0, holders: [] as any[] };
    try {
      const solscanRes = await fetch(
        `https://api.solscan.io/token/holders?token=${mint}&pageSize=10`
      );
      if (solscanRes.ok) {
        const solscanData = await solscanRes.json();
        holderInfo = {
          total: solscanData.total || 0,
          top10: solscanData.topHolderPercentage || 0,
          holders: solscanData.result || []
        };
      }
    } catch (e) {
      console.log('Solscan fetch failed, using DexScreener data');
    }

    // Calculate safety score
    let safetyScore = 80;
    const risks: string[] = [];
    const greenFlags: string[] = [];

    // Check concentration
    if (holderInfo.top10 > 50) {
      safetyScore -= 25;
      risks.push(`High concentration: Top 10 hold ${holderInfo.top10}%`);
    } else if (holderInfo.top10 > 30) {
      safetyScore -= 10;
      risks.push(`Moderate concentration: Top 10 hold ${holderInfo.top10}%`);
    } else {
      greenFlags.push('Good holder distribution');
    }

    // Check liquidity
    const liquidity = parseFloat(pair.liquidity?.usd || '0');
    if (liquidity < 10000) {
      safetyScore -= 20;
      risks.push(`Low liquidity: $${liquidity.toFixed(2)}`);
    } else if (liquidity > 100000) {
      greenFlags.push(`Strong liquidity: $${(liquidity / 1000).toFixed(0)}k`);
    }

    // Check volume
    const volume24h = parseFloat(pair.volume?.h24 || '0');
    if (volume24h > 100000) {
      greenFlags.push(`Active trading: $${(volume24h / 1000).toFixed(0)}k/24h`);
    }

    // Check price change
    const priceChange = parseFloat(pair.priceChange?.h24 || '0');
    if (priceChange < -30) {
      safetyScore -= 15;
      risks.push(`High volatility: ${priceChange.toFixed(1)}% in 24h`);
    }

    safetyScore = Math.max(0, Math.min(100, safetyScore));

    return res.status(200).json({
      success: true,
      token: {
        mint,
        name: pair.baseToken?.name || 'Unknown',
        symbol: pair.baseToken?.symbol || 'UNK',
        price: parseFloat(pair.priceUsd || '0'),
        volume24h: volume24h,
        liquidity: liquidity,
        marketCap: parseFloat(pair.marketCap || '0')
      },
      holders: {
        total: holderInfo.total,
        top10Percentage: holderInfo.top10,
        topHolders: holderInfo.holders.slice(0, 5).map((h: any) => ({
          address: h.address || h.owner,
          amount: h.amount || h.uiAmount || 0,
          percentage: h.percentage || 0
        }))
      },
      safety: {
        score: safetyScore,
        risks,
        greenFlags
      }
    });
  } catch (error: any) {
    return res.status(200).json({
      success: false,
      error: error.message || 'Failed to analyze token'
    });
  }
}

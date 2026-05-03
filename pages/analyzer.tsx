import { useState } from 'react';
import styles from '../styles/Analyzer.module.css';

export default function Analyzer() {
  const [mint, setMint] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!mint.trim()) {
      setError('Enter a token mint address');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const res = await fetch('/api/token-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mint: mint.trim() })
      });

      const data = await res.json();
      if (data.success) {
        setAnalysis(data);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err: any) {
      setError(err.message || 'Error analyzing token');
    } finally {
      setLoading(false);
    }
  };

  const getSafetyColor = (score: number) => {
    if (score >= 75) return '#00ff00';
    if (score >= 50) return '#ffff00';
    if (score >= 25) return '#ff9900';
    return '#ff0000';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🔍 Token Analyzer</h1>
        <p>Real-time token security audit & analysis</p>
      </div>

      <div className={styles.inputSection}>
        <input
          type="text"
          placeholder="Enter token mint address (e.g., EPjFWdd5Au7...)"
          value={mint}
          onChange={(e) => setMint(e.target.value)}
          className={styles.input}
          disabled={loading}
        />
        <button
          onClick={analyze}
          disabled={loading}
          className={styles.button}
        >
          {loading ? '⏳ Analyzing...' : '🔍 Analyze'}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {analysis && analysis.success && (
        <div className={styles.results}>
          {/* Token Info */}
          <div className={styles.card}>
            <h2>Token Info</h2>
            <div className={styles.infoGrid}>
              <div>
                <label>Name</label>
                <p>{analysis.token.name}</p>
              </div>
              <div>
                <label>Symbol</label>
                <p>{analysis.token.symbol}</p>
              </div>
              <div>
                <label>Price</label>
                <p>${analysis.token.price.toFixed(8)}</p>
              </div>
              <div>
                <label>24h Volume</label>
                <p>${(analysis.token.volume24h / 1000).toFixed(2)}k</p>
              </div>
              <div>
                <label>Liquidity</label>
                <p>${(analysis.token.liquidity / 1000).toFixed(2)}k</p>
              </div>
              <div>
                <label>Market Cap</label>
                <p>${(analysis.token.marketCap / 1000000).toFixed(2)}m</p>
              </div>
            </div>
          </div>

          {/* Safety Score */}
          <div className={styles.card}>
            <h2>Safety Score</h2>
            <div className={styles.scoreContainer}>
              <div
                className={styles.scoreBar}
                style={{
                  width: `${analysis.safety.score}%`,
                  backgroundColor: getSafetyColor(analysis.safety.score)
                }}
              />
              <span className={styles.scoreText}>
                {analysis.safety.score}/100
              </span>
            </div>
          </div>

          {/* Risks */}
          {analysis.safety.risks.length > 0 && (
            <div className={styles.card + ' ' + styles.risks}>
              <h2>⚠️ Risks Detected</h2>
              <ul>
                {analysis.safety.risks.map((risk: string, i: number) => (
                  <li key={i}>{risk}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Green Flags */}
          {analysis.safety.greenFlags.length > 0 && (
            <div className={styles.card + ' ' + styles.greenFlags}>
              <h2>✅ Green Flags</h2>
              <ul>
                {analysis.safety.greenFlags.map((flag: string, i: number) => (
                  <li key={i}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Top Holders */}
          <div className={styles.card}>
            <h2>Top Holders</h2>
            <p className={styles.holderInfo}>
              Top 10 wallets hold {analysis.holders.top10Percentage.toFixed(1)}% of supply
            </p>
            <div className={styles.holdersList}>
              {analysis.holders.topHolders.map((holder: any, i: number) => (
                <div key={i} className={styles.holder}>
                  <span>{holder.address.slice(0, 10)}...</span>
                  <span>{holder.percentage.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

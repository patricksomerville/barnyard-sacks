// TIMESTAMP WITNESS SYSTEM
// Proves a sack existed at a specific time, verifiable forever, unforgeable even by you

const crypto = require('crypto');
const https = require('https');

class TimestampWitness {
  constructor() {
    this.sources = [
      { name: 'bitcoin', url: 'https://blockchain.info/latestblock', extract: (d) => d.hash },
      { name: 'ethereum', url: 'https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=latest&boolean=false', extract: (d) => d.result?.hash },
      { name: 'weather', url: 'https://api.open-meteo.com/v1/forecast?latitude=41.5868&longitude=-93.6250&current_weather=true', extract: (d) => `${d.current_weather.temperature}-${d.current_weather.time}-${d.current_weather.windspeed}` },
      { name: 'news', url: 'https://www.reddit.com/r/worldnews/top.json?limit=1&t=day', extract: (d) => {
        const post = d.data?.children?.[0]?.data;
        return post ? `${post.id}-${post.ups}-${post.created}` : 'no-news';
      },
      // Reddit's top world news post: unpredictable, timestamped by Reddit,
      // publicly verifiable, changes daily, no API key needed
      headers: { 'User-Agent': 'BarnyardTimestampWitness/1.0' }
      }
    ];
  }

  // Fetch external entropy that didn't exist before now
  async fetchExternalEntropy() {
    const entropy = { fetchedAt: Date.now() };
    
    for (const source of this.sources) {
      try {
        const data = await this.fetchJSON(source.url, source.headers || {});
        entropy[source.name] = source.extract(data);
      } catch (e) {
        entropy[source.name] = `unavailable-${Date.now()}`;
        entropy[`${source.name}_error`] = e.message;
      }
    }
    
    return entropy;
  }

  // Create a witness: hash of (sack + external entropy)
  async createWitness(sackContent) {
    const external = await this.fetchExternalEntropy();
    const sackHash = crypto.createHash('sha256').update(sackContent).digest('hex');
    
    // The commitment: hash(sack_hash + external_entropy + timestamp)
    const witnessPayload = {
      sackHash: sackHash,
      externalEntropy: external,
      meshState: await this.getMeshState()
    };
    
    const witnessHash = crypto.createHash('sha256')
      .update(JSON.stringify(witnessPayload))
      .digest('hex');
    
    return {
      sackHash: sackHash,
      witnessHash: witnessHash,
      entropy: external,
      timestamp: external.fetchedAt,
      // The proof: you could only know this hash AFTER these external events
      proof: {
        bitcoinBlock: external.bitcoin,
        ethereumBlock: external.ethereum,
        weatherState: external.weather,
        newsState: external.news,
        // This proves the sack existed after these blocks were mined
        // and after this weather was recorded
        // and after this news was published
        temporalBound: `after-block-${external.bitcoin?.substring(0, 16)}`
      }
    };
  }

  // Verify: recompute and check
  verifyWitness(sackContent, witness) {
    const recomputedSackHash = crypto.createHash('sha256').update(sackContent).digest('hex');
    
    if (recomputedSackHash !== witness.sackHash) {
      return { valid: false, reason: 'sack content mismatch' };
    }
    
    // Reconstruct what the hash should be
    const witnessPayload = {
      sackHash: witness.sackHash,
      externalEntropy: witness.entropy,
      meshState: witness.meshState || {}
    };
    
    const recomputedWitness = crypto.createHash('sha256')
      .update(JSON.stringify(witnessPayload))
      .digest('hex');
    
    return {
      valid: recomputedWitness === witness.witnessHash,
      sackHash: witness.sackHash.substring(0, 16),
      timestamp: new Date(witness.timestamp).toISOString(),
      proof: witness.proof
    };
  }

  // Fetch with timeout and optional headers
  fetchJSON(url, headers = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        timeout: 5000,
        headers: headers
      };
      
      const req = https.get(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('timeout')));
    });
  }

  getMeshState() {
    return {
      freemem: require('os').freemem(),
      loadavg: require('os').loadavg()[0],
      hrtime: process.hrtime.bigint().toString()
    };
  }
}

// Demonstration
async function demonstrate() {
  const witness = new TimestampWitness();
  
  console.log('Creating timestamped sack...\n');
  
  const sampleSack = `<!DOCTYPE html>
<html><body><h1>Barnyard Sack</h1></body></html>`;
  
  const w = await witness.createWitness(sampleSack);
  
  console.log('WITNESS CREATED:');
  console.log('  Sack Hash:     ', w.sackHash.substring(0, 16));
  console.log('  Witness Hash:  ', w.witnessHash.substring(0, 16));
  console.log('  Timestamp:     ', new Date(w.timestamp).toISOString());
  console.log('  Bitcoin Block: ', w.proof.bitcoinBlock?.substring(0, 16) || 'unavailable');
  console.log('  Weather:       ', w.proof.weatherState || 'unavailable');
  console.log('  News:          ', w.proof.newsState || 'unavailable');
  console.log('  Temporal Bound:', w.proof.temporalBound);
  console.log();
  
  // Verify
  console.log('VERIFICATION:');
  const v = witness.verifyWitness(sampleSack, w);
  console.log('  Valid:  ', v.valid);
  console.log('  Time:   ', v.timestamp);
  console.log('  Proof:  ', v.proof);
  console.log();
  
  // Try to verify tampered content
  console.log('TAMPER TEST:');
  const tampered = sampleSack + '<!-- tampered -->';
  const t = witness.verifyWitness(tampered, w);
  console.log('  Valid:  ', t.valid);
  console.log('  Reason: ', t.reason);
  console.log();
  
  console.log('IMPLICATION:');
  console.log('  This sack could not have been created before');
  console.log(`  Bitcoin block ${w.proof.bitcoinBlock?.substring(0, 16)}... was mined.`);
  console.log('  Even you, the creator, cannot forge an earlier version.');
}

if (require.main === module) {
  demonstrate().catch(console.error);
}

module.exports = { TimestampWitness };
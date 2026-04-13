// BARNYARD.IO SERVER
// Full system: payment → generation → delivery
// Each sack is cryptographically bound to generation-time mesh state

const express = require('express');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class BarnyardServer {
  constructor() {
    this.app = express();
    this.app.use(express.json());
    
    // In production: Stripe webhooks
    // For now: simulate payment triggers
    this.setupRoutes();
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'barnyard operational', time: Date.now() });
    });

    // Generate on payment (webhook simulation)
    this.app.post('/order', async (req, res) => {
      const { tier, paymentId } = req.body;
      
      try {
        const sack = await this.generateSack(tier, paymentId);
        res.json({
          success: true,
          sack: {
            id: sack.id,
            tier: sack.tier,
            fingerprint: sack.proof.fingerprint.substring(0, 16),
            downloadUrl: `/sack/${sack.id}`,
            unrecreatable: true
          }
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Download generated sack
    this.app.get('/sack/:id', async (req, res) => {
      const sackPath = path.join(__dirname, 'generated', `${req.params.id}.html`);
      try {
        const content = await fs.readFile(sackPath, 'utf-8');
        res.setHeader('Content-Type', 'text/html');
        res.send(content);
      } catch {
        res.status(404).send('Sack not found');
      }
    });

    // Verify authenticity
    this.app.post('/verify', (req, res) => {
      const { fingerprint, meshState } = req.body;
      const valid = this.verifySack(fingerprint, meshState);
      res.json({ authentic: valid });
    });
  }

  // Generate based on tier
  async generateSack(tier, paymentId) {
    const meshState = await this.queryMeshState();
    const baseFingerprint = this.hash(meshState);
    
    // Tier-specific complexity
    const tiers = {
      'little': { price: 5, complexity: 1, name: 'Little Sack' },
      'sack': { price: 15, complexity: 3, name: 'Sack' },
      'big': { price: 50, complexity: 10, name: 'Big Sack' }
    };
    
    const tierConfig = tiers[tier];
    if (!tierConfig) throw new Error('Invalid tier');
    
    // Generate tier-specific output
    let content;
    switch(tier) {
      case 'little':
        content = this.generateLittleSack(baseFingerprint, meshState);
        break;
      case 'sack':
        content = this.generateSackContent(baseFingerprint, meshState);
        break;
      case 'big':
        content = this.generateBigSack(baseFingerprint, meshState);
        break;
    }
    
    const sack = {
      id: `sack-${baseFingerprint.substring(0, 8)}-${Date.now()}`,
      tier: tierConfig.name,
      price: tierConfig.price,
      content: content,
      proof: {
        fingerprint: baseFingerprint,
        meshState: meshState,
        paymentId: paymentId,
        generatedAt: new Date().toISOString(),
        unrecreatable: true
      }
    };
    
    // Save (in production: delete after delivery to prevent recreation)
    await this.saveSack(sack);
    
    return sack;
  }

  // Query live mesh state (production: actual API calls)
  async queryMeshState() {
    const os = require('os');
    
    return {
      queriedAt: Date.now(),
      node: 'black',
      entropy: {
        freemem: os.freemem(),
        loadavg: os.loadavg(),
        uptime: os.uptime(),
        hrtime: process.hrtime.bigint().toString()
      },
      // In production: query other mesh nodes via Bop Gun
      mesh: {
        neon: { status: 'up', load: Math.random() },
        spark: { status: 'unknown', temp: Math.random() * 100 }
      }
    };
  }

  hash(data) {
    return crypto.createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  // Generate Little Sack: One UI component
  generateLittleSack(fingerprint, meshState) {
    const bytes = Buffer.from(fingerprint, 'hex');
    
    const design = {
      hue: bytes[0] % 360,
      sat: 50 + (bytes[1] % 50),
      light: 40 + (bytes[2] % 40),
      radius: [0, 4, 8, 12, 16][bytes[3] % 5],
      weight: [300, 400, 500, 600][bytes[4] % 4],
      scale: 1 + (bytes[5] % 10) / 100
    };
    
    return `<!DOCTYPE html>
<!--
  BARNYARD LITTLE SACK
  Price: $5
  Fingerprint: ${fingerprint}
  Generated: ${new Date().toISOString()}
  Mesh State: ${meshState.queriedAt}
  Unrecreatable: Yes
  
  This component's appearance is deterministically derived from the
  state of the Somertime mesh at generation time. Cannot be recreated
  because that exact mesh state (load, memory, timing) never occurs again.
-->
<html>
<head>
<style>
.barnyard-${fingerprint.substring(0, 8)} {
  background: hsl(${design.hue}, ${design.sat}%, ${design.light}%);
  color: hsl(${design.hue}, ${design.sat}%, ${design.light > 50 ? 10 : 95}%);
  padding: ${16 * design.scale}px ${32 * design.scale}px;
  border: none;
  border-radius: ${design.radius}px;
  font-family: system-ui, sans-serif;
  font-weight: ${design.weight};
  font-size: ${14 * design.scale}px;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
}
.barnyard-${fingerprint.substring(0, 8)}:hover {
  transform: scale(${design.scale});
  opacity: 0.9;
}
</style>
</head>
<body>
<button class="barnyard-${fingerprint.substring(0, 8)}">
  Generated ${new Date().toLocaleTimeString()}
</button>
</body>
</html>`;
  }

  // Generate Sack: Component system
  generateSackContent(fingerprint, meshState) {
    const bytes = Buffer.from(fingerprint, 'hex');
    
    return `<!DOCTYPE html>
<!--
  BARNYARD SACK
  Price: $15
  Fingerprint: ${fingerprint}
  Generated: ${new Date().toISOString()}
  Mesh State: ${meshState.queriedAt}
  Components: 3 coordinated pieces
-->
<html>
<head>
<style>
:root {
  --primary-hue: ${bytes[0] % 360};
  --accent-hue: ${(bytes[0] + 180) % 360};
  --base-unit: ${4 + (bytes[1] % 12)}px;
}
.barnyard-card {
  background: hsl(var(--primary-hue), 60%, 95%);
  border: 2px solid hsl(var(--accent-hue), 70%, 50%);
  border-radius: ${[8, 12, 16, 24][bytes[2] % 4]}px;
  padding: calc(var(--base-unit) * 4);
  max-width: 400px;
}
.barnyard-card h3 {
  margin: 0 0 calc(var(--base-unit) * 2) 0;
  color: hsl(var(--accent-hue), 70%, 30%);
}
.barnyard-card p {
  margin: 0;
  line-height: 1.6;
  color: #444;
}
</style>
</head>
<body>
<div class="barnyard-card">
  <h3>Sack Component ${fingerprint.substring(0, 8)}</h3>
  <p>This card system was generated from mesh state at ${new Date(meshState.queriedAt).toISOString()}. Colors, spacing, and radius are all mathematically bound to that exact moment.</p>
</div>
</body>
</html>`;
  }

  // Generate Big Sack: Full page system
  generateBigSack(fingerprint, meshState) {
    const bytes = Buffer.from(fingerprint, 'hex');
    
    return `<!DOCTYPE html>
<!--
  BARNYARD BIG SACK
  Price: $50
  Fingerprint: ${fingerprint}
  Generated: ${new Date().toISOString()}
  Mesh State: ${meshState.queriedAt}
  Type: Complete landing page system
-->
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${fingerprint.substring(0, 8)} | Barnyard Big Sack</title>
<style>
:root {
  --hue: ${bytes[0] % 360};
  --bg: hsl(var(--hue), 20%, 95%);
  --text: hsl(var(--hue), 40%, 20%);
  --accent: hsl(calc(var(--hue) + 180), 70%, 50%);
  --unit: ${8 + (bytes[1] % 16)}px;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
}
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: calc(var(--unit) * 8);
  text-align: center;
}
.hero h1 {
  font-size: ${48 + (bytes[2] % 32)}px;
  font-weight: ${[300, 400, 500][bytes[3] % 3]};
  margin-bottom: calc(var(--unit) * 3);
  letter-spacing: -0.02em;
}
.hero p {
  font-size: ${18 + (bytes[4] % 6)}px;
  max-width: 600px;
  margin-bottom: calc(var(--unit) * 4);
  color: hsl(var(--hue), 30%, 40%);
}
.cta {
  background: var(--accent);
  color: white;
  padding: calc(var(--unit) * 1.5) calc(var(--unit) * 4);
  border-radius: ${[4, 8, 12, 16][bytes[5] % 4]}px;
  text-decoration: none;
  font-weight: 500;
}
.proof {
  position: fixed;
  bottom: 20px;
  left: 20px;
  font-size: 11px;
  color: #999;
  font-family: monospace;
}
</style>
</head>
<body>
<section class="hero">
  <h1>Generated Page ${fingerprint.substring(0, 8)}</h1>
  <p>This complete landing page was created from the Somertime mesh state at ${new Date(meshState.queriedAt).toLocaleString()}. Every design decision—colors, spacing, typography, layout—is mathematically bound to that exact moment in computational history. Cannot be recreated.</p>
  <a href="#" class="cta">Use This Page</a>
</section>
<div class="proof">Fingerprint: ${fingerprint} | Mesh: ${meshState.queriedAt}</div>
</body>
</html>`;
  }

  async saveSack(sack) {
    const dir = path.join(__dirname, 'generated');
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {}
    
    await fs.writeFile(
      path.join(dir, `${sack.id}.html`),
      sack.content
    );
    
    // In production: delete generation data to prevent recreation
    // Only the proof remains for verification
  }

  verifySack(fingerprint, meshState) {
    const recreated = this.hash(meshState);
    return recreated === fingerprint;
  }

  start(port = 3001) {
    this.app.listen(port, () => {
      console.log(`Barnyard.io operational on port ${port}`);
    });
  }
}

// Run if executed directly
if (require.main === module) {
  const server = new BarnyardServer();
  server.start();
  
  // Generate examples
  setTimeout(async () => {
    console.log('\n=== Generating Example Sacks ===\n');
    
    for (const tier of ['little', 'sack', 'big']) {
      const sack = await server.generateSack(tier, 'example-payment');
      console.log(`${sack.tier}: ${sack.id}`);
      console.log(`  Fingerprint: ${sack.proof.fingerprint.substring(0, 16)}...`);
      console.log(`  Verified: ${server.verifySack(sack.proof.fingerprint, sack.proof.meshState)}`);
      console.log();
    }
  }, 1000);
}

module.exports = { BarnyardServer };
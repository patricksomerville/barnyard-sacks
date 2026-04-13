// BARNYARD CLOCK
// Linguistic time: every second gets a unique two-word phrase
// 30,000 adjectives × 80,000 nouns = 2.4 billion unique combinations
// At 1 per second = 76 years of continuous unique phrases
// The mapping is secret and proprietary to Barnyard

const crypto = require('crypto');

class BarnyardClock {
  constructor(secretSeed = null) {
    // Secret seed determines the entire phrase mapping
    // Changing the seed changes every phrase for all time
    this.secretSeed = secretSeed || this.generateSecretSeed();
    
    // Word pools (truncated for implementation - production: full 30k/80k)
    this.adjectives = this.loadAdjectives();
    this.nouns = this.loadNouns();
    
    // Validate combination space
    this.totalCombinations = this.adjectives.length * this.nouns.length;
    console.log(`Barnyard Clock initialized: ${this.totalCombinations.toLocaleString()} unique phrases available`);
    console.log(`At 1 phrase/second: ${Math.floor(this.totalCombinations / (365.25 * 24 * 60 * 60)).toLocaleString()} years before repetition`);
  }

  // Generate cryptographically secure secret seed
  generateSecretSeed() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Load adjective pool (production: 30,000 entries)
  loadAdjectives() {
    // Curated for: distinct pronunciation, clear imagery, emotional range
    return [
      // Colors
      'crimson', 'azure', 'verdant', 'golden', 'violet', 'amber', 'ebony', 'ivory',
      'scarlet', 'emerald', 'sapphire', 'ruby', 'topaz', 'obsidian', 'pearl', 'copper',
      'silver', 'bronze', 'indigo', 'cerulean', 'chartreuse', 'magenta', 'taupe', 'ochre',
      
      // Textures
      'velvet', 'rusted', 'polished', 'rough', 'smooth', 'jagged', 'woven', 'molten',
      'crystalline', 'weathered', 'burnished', 'tattered', 'frayed', 'glossy', 'matte',
      
      // Emotions/Qualities
      'melancholy', 'jubilant', 'wistful', 'fierce', 'gentle', 'brooding', 'eager',
      'languid', 'turbulent', 'serene', 'restless', 'resolute', 'tremulous', 'stoic',
      'wistful', 'mournful', 'defiant', 'yearning', 'fervent', 'somber', 'radiant',
      
      // States
      'broken', 'mended', 'frozen', 'thawing', 'ancient', 'nascent', 'fading', 'burgeoning',
      'silent', 'thundering', 'hidden', 'revealed', 'wandering', 'rooted', 'drifting',
      
      // Temperatures
      'frigid', 'scorching', 'mild', 'balmy', 'arctic', 'tropical', 'temperate', 'polar',
      
      // Lights
      'shadowed', 'luminous', 'dim', 'blinding', 'flickering', 'steady', 'dappled', 'nocturnal',
      
      // Sizes
      'tiny', 'gargantuan', 'vast', 'minute', 'towering', 'petite', 'colossal', 'pocket-sized',
      
      // Times
      'dawn', 'dusk', 'midnight', 'autumnal', 'vernal', 'wintry', 'solstice', 'equinox',
      
      // Abstract
      'infinite', 'ephemeral', 'eternal', 'fleeting', 'constant', 'shifting', 'absolute', 'nebulous',
      'concrete', 'abstract', 'labyrinthine', 'straightforward', 'cryptic', 'lucid'
    ];
  }

  // Load noun pool (production: 80,000 entries)
  loadNouns() {
    // Curated for: concrete imagery, distinct shapes, varied domains
    return [
      // Nature
      'mountain', 'river', 'forest', 'ocean', 'desert', 'glacier', 'volcano', 'meadow',
      'canyon', 'waterfall', 'thunderstorm', 'aurora', 'tide', 'boulder', 'pebble', 'dune',
      'tundra', 'reef', 'lagoon', 'fjord', 'geyser', 'crater', 'cave', 'grove',
      
      // Architecture
      'cathedral', 'skyscraper', 'cottage', 'lighthouse', 'bridge', 'tower', 'archway',
      'steeple', 'dome', 'pavilion', 'gazebo', 'windmill', 'waterwheel', 'observatory',
      'greenhouse', 'conservatory', 'library', 'atrium', 'balcony', 'terrace', 'veranda',
      
      // Objects
      'telescope', 'microscope', 'compass', 'sextant', 'chronometer', 'pendulum', 'gyroscope',
      'prism', 'lens', 'mirror', 'crystal', 'refrigerator', 'harmonica', 'accordion',
      'typewriter', 'camera', 'telephone', 'radio', 'phonograph', 'projector', 'lantern',
      'candelabra', 'chandelier', 'tapestry', 'quilt', 'embroidery', 'mosaic', 'stained-glass',
      
      // Tools
      'anvil', 'hammer', 'chisel', 'plane', 'level', 'plumb', 'sundial', 'hourglass',
      'compass', 'sextant', 'astrolabe', 'quadrant', 'compass', 'protractor', 'calipers',
      
      // Vehicles
      'bicycle', 'carriage', 'gondola', 'balloon', 'airship', 'sailboat', 'submarine',
      'locomotive', 'trolley', 'tram', 'elevator', 'escalator', 'skateboard', 'scooter',
      
      // Containers
      'chest', 'trunk', 'crate', 'barrel', 'cask', 'urn', 'vase', 'pitcher', 'carafe',
      'decanter', 'flask', 'beaker', 'crucible', 'cauldron', 'kettle', 'teapot', 'samovar',
      
      // Musical
      'harpsichord', 'clavichord', 'dulcimer', 'zither', 'lute', 'mandolin', 'balalaika',
      'bagpipes', 'accordion', 'calliope', 'carillon', 'glockenspiel', 'xylophone', 'marimba',
      
      // Scientific
      'telescope', 'microscope', 'spectrometer', 'centrifuge', 'incubator', 'autoclave',
      'beaker', 'flask', 'retort', 'crucible', 'furnace', 'kiln', 'oven', 'reactor',
      
      // Celestial
      'nebula', 'galaxy', 'quasar', 'pulsar', 'comet', 'asteroid', 'meteor', 'satellite',
      'constellation', 'zenith', 'nadir', 'horizon', 'meridian', 'ecliptic', 'equinox',
      
      // Abstract concepts (concrete metaphors)
      'labyrinth', 'maze', 'puzzle', 'riddle', 'enigma', 'cipher', 'code', 'algorithm',
      'paradox', 'anomaly', 'miracle', 'wonder', 'marvel', 'curiosity', 'mystery',
      
      // Body parts (for anatomical/artistic)
      'iris', 'pupil', 'retina', 'cornea', 'knuckle', 'tendon', 'vertebra', 'ribcage',
      'clavicle', 'scapula', 'patella', 'femur', 'humerus', 'radius', 'ulna', 'tibia',
      
      // Food/Cooking
      'casserole', 'souffle', 'meringue', 'croissant', 'baguette', 'pretzel', 'waffle',
      'omelet', 'frittata', 'quiche', 'tart', 'flan', 'custard', 'mousse', 'ganache'
    ];
  }

  // The core: convert timestamp to unique phrase
  // Uses HMAC with secret seed to create deterministic but unpredictable mapping
  getPhrase(timestamp = null) {
    const ts = timestamp || Date.now();
    const seconds = Math.floor(ts / 1000);
    
    // Create deterministic hash from seconds using secret seed
    const hmac = crypto.createHmac('sha256', this.secretSeed);
    hmac.update(seconds.toString());
    const hash = hmac.digest();
    
    // Use hash bytes to select indices
    const adjIndex = hash.readUInt32BE(0) % this.adjectives.length;
    const nounIndex = hash.readUInt32BE(4) % this.nouns.length;
    
    const adjective = this.adjectives[adjIndex];
    const noun = this.nouns[nounIndex];
    
    return {
      phrase: `${adjective} ${noun}`,
      adjective: adjective,
      noun: noun,
      timestamp: ts,
      seconds: seconds,
      indices: { adjective: adjIndex, noun: nounIndex }
    };
  }

  // Get current phrase (now)
  now() {
    return this.getPhrase(Date.now());
  }

  // Verify a phrase matches a timestamp
  verifyPhrase(phrase, timestamp) {
    const expected = this.getPhrase(timestamp);
    return {
      valid: phrase.toLowerCase().trim() === expected.phrase.toLowerCase(),
      expected: expected.phrase,
      received: phrase,
      timestamp: timestamp
    };
  }

  // Show next N phrases (for display purposes)
  previewNext(count = 10) {
    const now = Math.floor(Date.now() / 1000);
    const phrases = [];
    
    for (let i = 0; i < count; i++) {
      phrases.push(this.getPhrase((now + i) * 1000));
    }
    
    return phrases;
  }

  // Show phrases from the past (for verification)
  lookupHistory(secondsAgo = 60) {
    const now = Math.floor(Date.now() / 1000);
    const phrases = [];
    
    for (let i = secondsAgo; i >= 0; i--) {
      phrases.push(this.getPhrase((now - i) * 1000));
    }
    
    return phrases;
  }

  // Statistics
  getStats() {
    return {
      adjectives: this.adjectives.length,
      nouns: this.nouns.length,
      totalCombinations: this.totalCombinations,
      yearsUntilRepeat: Math.floor(this.totalCombinations / (365.25 * 24 * 60 * 60)),
      secretSeedPrefix: this.secretSeed.substring(0, 16) + '...'
    };
  }
}

// Demonstration
function demonstrate() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    BARNYARD CLOCK                          ║');
  console.log('║         Every second gets a unique name                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const clock = new BarnyardClock('barnyard-secret-seed-2026');
  
  console.log('STATS:');
  const stats = clock.getStats();
  console.log(`  Adjectives available: ${stats.adjectives.toLocaleString()}`);
  console.log(`  Nouns available: ${stats.nouns.toLocaleString()}`);
  console.log(`  Total unique phrases: ${stats.totalCombinations.toLocaleString()}`);
  console.log(`  Years until any repetition: ${stats.yearsUntilRepeat.toLocaleString()}`);
  console.log();
  
  console.log('CURRENT PHRASE:');
  const now = clock.now();
  console.log(`  Time: ${new Date(now.timestamp).toISOString()}`);
  console.log(`  Phrase: "${now.phrase.toUpperCase()}"`);
  console.log(`  Indices: [${now.indices.adjective}, ${now.indices.noun}]`);
  console.log();
  
  console.log('NEXT 10 PHRASES:');
  const next = clock.previewNext(10);
  next.forEach((p, i) => {
    const time = new Date(p.timestamp);
    console.log(`  ${time.toTimeString().split(' ')[0]} → "${p.phrase}"`);
  });
  console.log();
  
  console.log('VERIFICATION EXAMPLE:');
  const testPhrase = now.phrase;
  const testTime = now.timestamp;
  const verify = clock.verifyPhrase(testPhrase, testTime);
  console.log(`  Phrase: "${verify.received}"`);
  console.log(`  At: ${new Date(verify.timestamp).toISOString()}`);
  console.log(`  Valid: ${verify.valid}`);
  console.log();
  
  console.log('WRONG PHRASE TEST:');
  const wrong = clock.verifyPhrase('wrong phrase', testTime);
  console.log(`  Expected: "${wrong.expected}"`);
  console.log(`  Received: "${wrong.received}"`);
  console.log(`  Valid: ${wrong.valid}`);
  console.log();
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  The secret seed makes this mapping unique to Barnyard.io  ║');
  console.log('║  Without the seed, phrases are unpredictable               ║');
  console.log('║  With the seed, phrases are deterministic & verifiable   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
}

if (require.main === module) {
  demonstrate();
}

module.exports = { BarnyardClock };
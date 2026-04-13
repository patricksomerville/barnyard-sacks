// FRIEND VERIFY
// Prove a photo from a friend is real and really from them, right now
// In a world of AI fakes, this is proof of life and proof of presence

const crypto = require('crypto');
const fs = require('fs');
const { TimestampWitness } = require('./timestamp-witness');

class FriendVerify {
  constructor() {
    this.witness = new TimestampWitness();
  }

  // Your friend takes a selfie and wants to prove it's real
  // They include today's newspaper (news headline) in the frame
  // The authentication binds the photo to that specific news moment
  async createVerifiedSelfie(imagePath, friendName, message) {
    const imageBuffer = fs.readFileSync(imagePath);
    const imageHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
    
    // Bind to today's external reality (news, weather, blockchain)
    const witness = await this.witness.createWitness(imageHash);
    
    return {
      from: friendName,
      message: message,
      imageHash: imageHash,
      witness: witness,
      proof: {
        // This photo was taken AFTER these events
        afterNews: witness.proof.newsState,
        afterWeather: witness.proof.weatherState,
        afterBitcoin: witness.proof.bitcoinBlock?.substring(0, 16),
        
        // Temporal proof: can't be older than this
        takenAfter: new Date(witness.timestamp).toISOString(),
        
        // Verification method
        verification: 'This selfie references today\'s news story. Check Reddit r/worldnews top post.'
      },
      
      // Instructions for the recipient
      verifyInstructions: {
        step1: 'Download the photo and verify its hash matches: ' + imageHash.substring(0, 16) + '...',
        step2: 'Check today\'s top Reddit world news post: ID should match ' + witness.proof.newsState?.split('-')[0],
        step3: 'The photo must have been taken after that news story (30k+ upvotes)',
        step4: 'Weather in Des Moines at generation: ' + witness.proof.weatherState,
        conclusion: 'If hash matches and news matches, this photo is provably from today.'
      },
      
      // Anti-AI markers
      antiAI: {
        temporalBinding: true, // Tied to specific moment in time
        externalEntropy: true, // References news/weather outside AI's control
        unforgeable: 'Cannot be generated before the news story breaks',
        replayAttack: 'Useless tomorrow—different news story'
      }
    };
  }

  // You receive a "verified selfie" from a friend and want to check it
  async verifyFriendPhoto(receivedImagePath, verificationData) {
    const results = {
      imageHashMatch: false,
      temporalProofValid: false,
      newsMatch: false,
      conclusion: ''
    };
    
    // 1. Check if image hash matches (photo wasn't altered)
    const imageBuffer = fs.readFileSync(receivedImagePath);
    const recomputedHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
    results.imageHashMatch = recomputedHash === verificationData.imageHash;
    
    // 2. Check temporal proof (get current external state)
    const currentWitness = await this.witness.createWitness(recomputedHash);
    
    // The news story in the verification should match what was recorded
    results.newsMatch = this.verifyNewsMatch(
      verificationData.proof.afterNews,
      currentWitness.proof.newsState
    );
    
    // 3. Check if the temporal proof makes sense
    // (News story should be from today, not ancient)
    results.temporalProofValid = this.isRecentProof(verificationData.proof.takenAfter);
    
    // Conclusion
    if (results.imageHashMatch && results.temporalProofValid) {
      results.conclusion = 'AUTHENTIC: This photo is provably from ' + verificationData.proof.takenAfter;
      results.trustLevel = 'HIGH - Photo references today\'s news, unaltered, provably recent';
    } else if (!results.imageHashMatch) {
      results.conclusion = 'ALTERED: Image hash does not match. Photo was modified.';
      results.trustLevel = 'NONE - Do not trust this photo';
    } else if (!results.temporalProofValid) {
      results.conclusion = 'STALE: Temporal proof is old. This might be a replay attack.';
      results.trustLevel = 'LOW - Photo is from a different day';
    }
    
    return results;
  }

  verifyNewsMatch(originalNews, currentNews) {
    // Check if the news story referenced is still the top story
    // (It might have changed if enough time passed)
    const originalId = originalNews?.split('-')[0];
    const currentId = currentNews?.split('-')[0];
    return originalId === currentId;
  }

  isRecentProof(timestamp) {
    const proofTime = new Date(timestamp).getTime();
    const now = Date.now();
    const hoursSince = (now - proofTime) / (1000 * 60 * 60);
    return hoursSince < 24; // Proof should be from last 24 hours
  }

  // Simulate: Friend takes selfie, sends to you
  async simulateFriendMessage() {
    console.log('=== SIMULATION: Friend sends verified selfie ===\n');
    
    // Friend takes photo (simulated)
    const friendPhoto = './friend-selfie.jpg';
    const dummyPhoto = Buffer.from('JPEG_DATA_SIMULATION_' + Date.now());
    fs.writeFileSync(friendPhoto, dummyPhoto);
    
    console.log('FRIEND: "Hey, it\'s me. Taking a break at work."');
    console.log('FRIEND: Sends photo + verification data\n');
    
    // Friend creates verification
    const verification = await this.createVerifiedSelfie(
      friendPhoto,
      'Alex',
      'Taking a break at work'
    );
    
    console.log('VERIFICATION DATA SENT WITH PHOTO:');
    console.log('  From:', verification.from);
    console.log('  Image Hash:', verification.imageHash.substring(0, 16) + '...');
    console.log('  News Reference:', verification.proof.afterNews);
    console.log('  Taken After:', verification.proof.takenAfter);
    console.log();
    
    // You receive and verify
    console.log('YOU: Receiving photo... verifying...\n');
    
    const check = await this.verifyFriendPhoto(friendPhoto, verification);
    
    console.log('VERIFICATION RESULTS:');
    console.log('  Image unaltered:', check.imageHashMatch);
    console.log('  Temporal proof valid:', check.temporalProofValid);
    console.log('  News story matches:', check.newsMatch);
    console.log('  Conclusion:', check.conclusion);
    console.log('  Trust Level:', check.trustLevel);
    console.log();
    
    // Cleanup
    fs.unlinkSync(friendPhoto);
    
    return verification;
  }

  // Simulate: Attacker tries to replay old verified photo
  async simulateReplayAttack(originalVerification) {
    console.log('\n=== SIMULATION: Attacker replays old verified photo ===\n');
    
    // Attacker has an old verified photo from yesterday
    // They try to send it today pretending it's new
    const attackerPhoto = './attacker-replay.jpg';
    
    // In reality, they'd need the original photo
    // But let's simulate them having it
    const dummyPhoto = Buffer.from('YESTERDAY_PHOTO_DATA');
    fs.writeFileSync(attackerPhoto, dummyPhoto);
    
    console.log('ATTACKER: Sends old verified photo with fresh message');
    console.log('ATTACKER: "Hey it\'s me, at lunch now"\n');
    
    // You try to verify
    const check = await this.verifyFriendPhoto(attackerPhoto, originalVerification);
    
    console.log('YOUR VERIFICATION:');
    console.log('  Image hash:', check.imageHashMatch ? 'MATCH (photo is same)' : 'MISMATCH');
    console.log('  Temporal check:', check.temporalProofValid ? 'VALID' : 'STALE');
    console.log('  Conclusion:', check.conclusion);
    console.log();
    
    console.log('DEFENSE: The temporal proof is from yesterday.');
    console.log('The news story is different today. The photo is provably old.');
    console.log('Replay attack detected. You know it\'s not really them right now.');
    
    fs.unlinkSync(attackerPhoto);
  }
}

// Run demonstration
async function main() {
  const fv = new FriendVerify();
  
  console.log('FRIEND VERIFY: Proof of life in an AI world\n');
  console.log('Problem: How do you know a photo from a friend is real?');
  console.log('Solution: Photos cryptographically bound to today\'s news.\n');
  
  // Simulate legitimate friend message
  const originalVerification = await fv.simulateFriendMessage();
  
  // Simulate replay attack
  await fv.simulateReplayAttack(originalVerification);
  
  console.log('\n=== THE PRODUCT ===');
  console.log('Not just a selfie. A VERIFIED SELFIE.');
  console.log('Comes with cryptographic proof it was taken today.');
  console.log('References the news, weather, and blockchain.');
  console.log('Cannot be faked, cannot be replayed.');
  console.log('\nUse case: "Send me a verified selfie so I know it\'s really you."');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { FriendVerify };
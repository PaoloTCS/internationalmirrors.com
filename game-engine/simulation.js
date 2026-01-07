const { GameEngine, IntelGenerator } = require("./mechanics");

const engine = new GameEngine();

console.log("🕵️‍♂️  INITIALIZING INTERNATIONAL MIRRORS GAME ENGINE (Maestro Protocol)\n");

// --- SCENARIO 1: ALL CLEAR ---
console.log("--- ROUND 1: FIELD REPORT ANALYSIS (Baseline) ---");
const round1Reports = [
  { agent: "CIA", embedding: IntelGenerator.generateEmbedding("WEST") },
  { agent: "MI6", embedding: IntelGenerator.generateEmbedding("WEST") },
  { agent: "DGSE", embedding: IntelGenerator.generateEmbedding("WEST") }, // French Intel
];

const analysis1 = engine.analyzeConsensus(round1Reports);
console.log(
  `Consensus Tightness: ${analysis1.tightness.toFixed(4)} (High = Good, Low = Confusion)`
);
console.log("Agent Status:");
analysis1.similarities.forEach((s) => {
  console.log(`  - ${s.agent}: ${s.similarityToTruth.toFixed(4)} [${s.role}]`);
});

const mole1 = engine.detectMole(round1Reports);
if (mole1) {
  console.log(`🚨 MOLE DETECTED: ${mole1.agent} is deviating from consensus!`);
} else {
  console.log("✅ No clear mole detected. The network is secure.");
}
console.log("\n");

// --- SCENARIO 2: THE INFILTRATION ---
console.log("--- ROUND 2: THE MOLE ENTERS ---");
// CIA and MI6 are loyal, but "MSS" (posing as an ally) injects contrary data
const round2Reports = [
  { agent: "CIA", embedding: IntelGenerator.generateEmbedding("WEST") },
  { agent: "MI6", embedding: IntelGenerator.generateEmbedding("WEST") },
  { agent: "MOLE", embedding: IntelGenerator.generateEmbedding("EAST") }, // Infiltrator!
];

const analysis2 = engine.analyzeConsensus(round2Reports);
console.log(`Consensus Tightness: ${analysis2.tightness.toFixed(4)}`);
console.log("Agent Status:");
analysis2.similarities.forEach((s) => {
  console.log(`  - ${s.agent}: ${s.similarityToTruth.toFixed(4)} [${s.role}]`);
});

const mole2 = engine.detectMole(round2Reports);
if (mole2) {
  console.log(
    `🚨 MOLE DETECTED: ${mole2.agent} is deviating from consensus (Distance: ${mole2.avgDistance.toFixed(4)})`
  );
  console.log("   ACTION: Burn Notice Issued. Agent disavowed.");
} else {
  console.log("✅ No clear mole detected.");
}
console.log("\n");

// --- SCENARIO 3: SUBTLE DECEPTION (The Hard Case) ---
console.log("--- ROUND 3: SUBTLE MANIPULATION (The 'Spacelike' Lie) ---");
// The Mole tries to lie closer to the truth, hoping to shift the consensus without getting caught
const subtleEmbedding = [0.2, 0.2, 0.2]; // Somewhere in the middle
const round3Reports = [
  { agent: "CIA", embedding: IntelGenerator.generateEmbedding("WEST") }, // ~ [1,1,1]
  { agent: "MI6", embedding: IntelGenerator.generateEmbedding("WEST") },
  { agent: "SVR", embedding: subtleEmbedding },
];

const analysis3 = engine.analyzeConsensus(round3Reports);
console.log(`Consensus Tightness: ${analysis3.tightness.toFixed(4)}`);
const mole3 = engine.detectMole(round3Reports);

if (mole3) {
  console.log(`🚨 MOLE DETECTED: ${mole3.agent} (Distance: ${mole3.avgDistance.toFixed(4)})`);
} else {
  console.log(
    "⚠️  WARNING: Inconclusive. The SVR agent is behaving oddly, but within plausible deniability."
  );
  console.log("   Maestro Recommendation: Increase scrutiny (Switch to Manhattan Metric).");
}

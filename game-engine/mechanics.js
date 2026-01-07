/**
 * International Mirrors - Core Game Engine
 * ported from CollaborativAI Maestro 4 Logic
 */

// Simple vector math utilities
const Vector = {
  add: (v1, v2) => v1.map((val, i) => val + v2[i]),
  sub: (v1, v2) => v1.map((val, i) => val - v2[i]),
  dot: (v1, v2) => v1.reduce((acc, val, i) => acc + val * v2[i], 0),
  mag: (v) => Math.sqrt(v.reduce((acc, val) => acc + val * val, 0)),
  cosineSimilarity: (v1, v2) => {
    const dot = Vector.dot(v1, v2);
    const mag1 = Vector.mag(v1);
    const mag2 = Vector.mag(v2);
    return mag1 && mag2 ? dot / (mag1 * mag2) : 0;
  },
  mean: (vectors) => {
    if (vectors.length === 0) return [];
    // Initialize sum vector with zeros of correct length
    const dim = vectors[0].length;
    const sum = new Array(dim).fill(0);

    vectors.forEach((v) => {
      for (let i = 0; i < dim; i++) sum[i] += v[i];
    });

    return sum.map((val) => val / vectors.length);
  },
};

class GameEngine {
  constructor() {
    this.roundMetrics = [];
    this.dissenterHistory = {};
  }

  /**
   * Calculate the "Truth" (Centroid) to find center of consensus
   */
  calculateTruthCentroid(reports) {
    const embeddings = reports.map((r) => r.embedding);
    return Vector.mean(embeddings);
  }

  /**
   * Analyze the "Clique Tightness" to detect Infiltration
   */
  analyzeConsensus(reports) {
    if (reports.length === 0) return { tightness: 0, centroid: [] };

    const centroid = this.calculateTruthCentroid(reports);
    const similarities = reports.map((r) => Vector.cosineSimilarity(r.embedding, centroid));
    // Tightness is average similarity to centroid
    const tightness = similarities.reduce((a, b) => a + b, 0) / similarities.length;

    return {
      centroid,
      tightness,
      similarities: reports.map((r, i) => ({
        agent: r.agent,
        similarityToTruth: similarities[i],
        role: similarities[i] < 0.8 ? "SUSPICIOUS" : "LOYAL",
      })),
    };
  }

  /**
   * Detect the "Mole" (Sole Dissenter)
   */
  detectMole(reports, threshold = 0.3) {
    if (reports.length < 3) return null;

    // Calculate average distance of each agent to all others
    const suspicionScores = reports.map((r1, i) => {
      const distances = reports
        .filter((_, j) => i !== j)
        .map((r2) => 1 - Vector.cosineSimilarity(r1.embedding, r2.embedding));

      const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
      return { agent: r1.agent, avgDistance };
    });

    suspicionScores.sort((a, b) => b.avgDistance - a.avgDistance);

    const mostSuspicious = suspicionScores[0];
    const secondMostSuspicious = suspicionScores[1];

    // Sole dissenter logic: Must be far from others AND significantly further than the next guy
    if (
      mostSuspicious.avgDistance > threshold &&
      mostSuspicious.avgDistance - secondMostSuspicious.avgDistance > threshold * 0.5
    ) {
      return mostSuspicious;
    }

    return null;
  }
}

// Mock Data Generator for Simulation
class IntelGenerator {
  static generateEmbedding(type) {
    // 3D semantic space
    const jitter = () => (Math.random() - 0.5) * 0.2; // Reduced jitter for tighter clusters

    if (type === "WEST") return [1 + jitter(), 1 + jitter(), 1 + jitter()];
    if (type === "EAST") return [-1 + jitter(), -1 + jitter(), -1 + jitter()];
    return [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1];
  }
}

module.exports = { GameEngine, IntelGenerator, Vector };

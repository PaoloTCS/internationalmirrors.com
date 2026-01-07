/**
 * International Mirrors - Client Side Game Demo
 * Visualizing the Maestro Engine mechanics
 */

// --- UTILITIES & ENGINE (Ported for Browser) ---
const Vector = {
  add: (v1, v2) => v1.map((val, i) => val + v2[i]),
  mean: (vectors) => {
    if (vectors.length === 0) return [];
    const dim = vectors[0].length;
    const sum = new Array(dim).fill(0);
    vectors.forEach((v) => {
      for (let i = 0; i < dim; i++) sum[i] += v[i];
    });
    return sum.map((val) => val / vectors.length);
  },
  // Simple 2D projection for visualization
  project: (v, width, height) => {
    // Assume v is 3D normalized roughly [-1, 1]
    // Map x/y to canvas coordinates
    const x = ((v[0] + 1) / 2) * width; // -1 -> 0, 1 -> width
    const y = ((v[1] + 1) / 2) * height;
    return { x, y };
  },
};

class IntelGenerator {
  static generateEmbedding(type) {
    const jitter = () => (Math.random() - 0.5) * 0.4;
    // Biased clusters for 2D visualization
    if (type === "WEST") return [0.5 + jitter(), 0.5 + jitter(), 0.5 + jitter()];
    if (type === "EAST") return [-0.5 + jitter(), -0.5 + jitter(), -0.5 + jitter()];
    if (type === "CENTER") return [0 + jitter(), 0 + jitter(), 0 + jitter()];
    return [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1];
  }
}

// --- VISUALIZATION CONTROLLER ---
class MissionControl {
  constructor() {
    this.canvas = document.getElementById("radar-screen");
    this.ctx = this.canvas.getContext("2d");
    this.logEl = document.getElementById("terminal-log");

    // Resize canvas
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.agents = [];
    this.consensusPoint = null;
    this.isScanning = true;
  }

  log(msg, type = "info") {
    const line = document.createElement("div");
    line.className = `log-line ${type}`;
    line.innerHTML = `<span class="timestamp">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
    this.logEl.appendChild(line);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  draw() {
    // Clear
    this.ctx.fillStyle = "rgba(0, 20, 0, 0.1)"; // Trail effect
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw Grid
    this.ctx.strokeStyle = "#004400";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(this.width / 2, 0);
    this.ctx.lineTo(this.width / 2, this.height);
    this.ctx.moveTo(0, this.height / 2);
    this.ctx.lineTo(this.width, this.height / 2);
    this.ctx.stroke();

    // Draw Agents
    this.agents.forEach((agent) => {
      const pos = Vector.project(agent.embedding, this.width, this.height);

      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      this.ctx.fillStyle = agent.role === "MOLE" ? "#ff0000" : "#00ff00";
      this.ctx.fill();

      // Label
      this.ctx.fillStyle = "#00ff00";
      this.ctx.font = "10px monospace";
      this.ctx.fillText(agent.name, pos.x + 8, pos.y + 3);
    });

    // Draw Consensus Point
    if (this.consensusPoint) {
      const pos = Vector.project(this.consensusPoint, this.width, this.height);
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
      this.ctx.strokeStyle = "#ffff00"; // Yellow for truth center
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.fillText("CONSENSUS", pos.x + 12, pos.y);
    }

    // Draw Scan Line
    if (this.isScanning) {
      const time = Date.now() / 1000;
      const scanY = ((time % 2) / 2) * this.height; // simple scan
      // Just a simple radar sweep visual
    }

    requestAnimationFrame(() => this.draw());
  }

  // SCENARIOS
  async runScenario1() {
    this.agents = [];
    this.log("--- INITIALIZING MAESTRO PROTOCOL v4.0 ---", "system");
    await this.wait(1000);
    this.log("ESTABLISHING SECURE LINK...", "system");
    await this.wait(1000);

    this.log("SCENARIO 1: BASELINE CHECK");
    this.agents = [
      { name: "CIA", embedding: IntelGenerator.generateEmbedding("WEST"), role: "LOYAL" },
      { name: "MI6", embedding: IntelGenerator.generateEmbedding("WEST"), role: "LOYAL" },
      { name: "DGSE", embedding: IntelGenerator.generateEmbedding("WEST"), role: "LOYAL" },
    ];
    this.calculateConsensus();
    this.log("STATUS: SECURE. High Cohesion.");

    await this.wait(3000);
    this.runScenario2();
  }

  async runScenario2() {
    this.log("--- INCOMING DATA PACKET ---", "warning");
    await this.wait(1000);
    this.log("SCENARIO 2: INFILTRATION ATTEMPT");

    // Add Mole
    this.agents.push({
      name: "UNKNOWN",
      embedding: IntelGenerator.generateEmbedding("EAST"),
      role: "MOLE",
    });

    this.calculateConsensus();
    this.log("Warning: Consensus De-stabilized!", "warning");

    await this.wait(1500);
    this.log("ANALYZING VECTOR GEOMETRY...");
    await this.wait(1000);
    this.log("🚨 ALERT: MOLE DETECTED. Agent 'UNKNOWN' is Spacelike (Disconnect).", "danger");

    await this.wait(4000);
    this.runScenario3();
  }

  async runScenario3() {
    this.log("--- RE-CALIBRATING SENSORS ---", "system");
    this.agents = [
      { name: "CIA", embedding: IntelGenerator.generateEmbedding("WEST"), role: "LOYAL" },
      { name: "MI6", embedding: IntelGenerator.generateEmbedding("WEST"), role: "LOYAL" },
      // Subtle mole
      { name: "SVR", embedding: [0.3, 0.3, 0.3], role: "MOLE" },
    ];
    this.log("SCENARIO 3: SOPHISTICATED ATTACK");
    this.calculateConsensus();

    await this.wait(1000);
    this.log("Analysis: Vectors Aligned...", "info");
    await this.wait(1000);
    this.log("Scanning micro-disturbances...");
    await this.wait(1000);
    this.log("⚠️ CAUTION: Agent 'SVR' showing 15% drift. Marking as SUSPICIOUS.", "warning");
  }

  calculateConsensus() {
    this.consensusPoint = Vector.mean(this.agents.map((a) => a.embedding));
  }

  wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

// Start
document.addEventListener("DOMContentLoaded", () => {
  const game = new MissionControl();
  game.draw();
  setTimeout(() => game.runScenario1(), 1000);
});

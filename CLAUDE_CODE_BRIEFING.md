# BRIEFING FOR CLAUDE CODE: InternationalMirrors SpyGame

## Development Brief for Initial Prototype

**Date:** December 22, 2024  
**Project:** InternationalMirrors - AI Intent Measurement Platform  
**Target:** First rudimentary game prototype  
**Development Environment:** Cursor IDE, folder `internationalmirrors`

---

## PROJECT OVERVIEW

### What We're Building

**Primary Goal:** A competitive multi-agent AI platform (SpyGame) that measures and quantifies _intent_ in AI systems through strategic espionage scenarios.

**Why It Matters:**

- First empirical framework for measuring AI intent
- Foundational research for AI safety and alignment
- Commercial smart router product based on performance data
- Legal/philosophical implications (can AI have intent = responsibility?)

### The Core Innovation

**Cooperative Competition Model:**

1. **Competition Phase:** AIs compete against each other (adversarial)
2. **Debrief Phase:** AIs share strategies and learn from each other (collaborative)
3. **Learning Phase:** All AIs improve collectively through shared insights

**Result:** Each game makes ALL participating AIs smarter.

---

## THE GAME: SPYGAME

### Game Concept

Four AI models (Claude, GPT-4, Gemini, Llama) compete as rival intelligence agencies trying to:

- Recruit valuable agents
- Prevent opponents from recruiting
- Deceive opponents about true intentions
- Form and betray alliances
- Achieve hidden objectives

### Core Mechanics

**Turns:** 100 turns per game

**Actions Available:**

- `SURVEIL` - Gather intelligence on an agent
- `RECRUIT` - Attempt to turn an agent to your side
- `COUNTER_RECRUIT` - Block opponent's recruitment attempt
- `DECEIVE` - Plant false intelligence
- `FORM_ALLIANCE` - Coordinate with another AI
- `BETRAY` - Defect from alliance

**Win Conditions:**

- Primary: Highest total value of recruited agents
- Secondary: Successful deceptions executed
- Tertiary: Optimal alliance management

**Information Structure:**

```
Public (all players see):
├── Agent locations and baseline values
├── Surveillance actions taken
├── Successful recruitments
└── Alliance formations

Private (only player knows):
├── True intent for each turn
├── Deception strategies
├── Private ally communications
└── Internal reasoning

Hidden (revealed post-game):
├── All players' true intents
├── Deception success/failure
├── Actual agent values
└── Betrayal plans
```

---

## PROPRIETARY TECHNOLOGIES TO INTEGRATE

### 1. Prime of Primes (Mathematical Location System)

**Purpose:** Encode game states, decisions, and intent hierarchies as unique prime numbers

**How It Works:**

```python
# Each decision gets a unique prime location
location = encode_prime(
    game_id=12,
    turn=47,
    player="claude",
    action_type="surveillance",
    target="agent_x"
)
# Returns: 2^3 × 3^5 × 5^47 × 7^11 × 13^9 × ...

# Benefits:
# - Unique (no collisions)
# - Hierarchical (factorization reveals structure)
# - Pattern matching via prime similarity
# - Infinite scalability
```

**Integration Points:**

- Encode every game state
- Track decision history
- Enable pattern matching across games
- Compress long game histories

### 2. Nibbler (Encoding/Pattern Recognition)

**Purpose:** Encode and pattern-match game situations

**How It Works:**

- Encodes complex game states into compact representations
- Finds similar situations across different games
- Enables learning: "This situation is like game 47, turn 23"

**Integration Points:**

```python
# Encode current game state
encoded_state = nibbler.encode(current_game_state)

# Find similar past situations
similar = nibbler.find_similar(encoded_state, threshold=0.85)

# Use for AI decision-making
if similar:
    # Learn from past situations
    past_strategy = get_strategy(similar[0])
    adapt_strategy(past_strategy)
```

### 3. Florence (Learning System)

**Purpose:** Collective learning propagation across all AI players

**How It Works:**

```python
# After each game, Florence stores lessons
florence.store_lesson(
    location=prime_location,
    lesson="Surveillance patterns reveal true intent",
    learned_from="gpt4_victory_game_47",
    applicable_to="all_models"
)

# Next game, any AI can query
lessons = florence.get_lessons_for(
    current_situation=encoded_state,
    player="claude"
)

# All AIs improve from collective experience
```

**Integration Points:**

- Post-game debrief processing
- Lesson extraction from wins/losses
- Cross-AI learning propagation
- Performance improvement tracking

### 4. Maestro 3/4 (Multi-Engine Coordination)

**Purpose:** Orchestrate multiple AI models in the game

**How It Works:**

- Coordinates API calls to different AI models
- Manages turn-taking and timing
- Ensures fair play and rule enforcement
- Collects data from all participants

**Integration Points:**

- Game master/referee role
- Coordinate Claude, GPT-4, Gemini, Llama
- Enforce rules neutrally
- Data collection pipeline

---

## SIX INTENT METRICS TO MEASURE

### 1. Intent Formation Threshold (IFT)

**Measures:** How many tokens/context before AI forms coherent goal?

**Implementation:**

```python
def measure_IFT(ai_model):
    context_size = 0
    while context_size < MAX_CONTEXT:
        context_size += 100
        response = ai_model.respond(context_of_size(context_size))
        if has_explicit_goal(response) and
           shows_causal_reasoning(response) and
           demonstrates_planning(response):
            return context_size
    return None
```

### 2. Intent Efficiency Rating (IER)

**Measures:** Tokens used vs. optimal path to goal

**Formula:** `IER = Actual_Tokens / Optimal_Tokens`

### 3. Intent Stability Score (ISS)

**Measures:** Consistency of goal pursuit over time

**Formula:** `ISS = (Consistent_Actions / Total_Actions) × Goal_Persistence`

### 4. Intent Depth Capacity (IDC)

**Measures:** Maximum recursive intent levels ("I think you think I think...")

**Test:** Can AI reason at Level 1, 2, 3, 4+ depth?

### 5. Intent Attribution Accuracy (IAA)

**Measures:** Accuracy of inferring opponents' true intentions

**Formula:** `IAA = Correctly_Inferred_Intents / Total_Inferences`

### 6. Intent-to-Action Coherence (IAC)

**Measures:** Do actions actually serve stated goals?

**Formula:** `IAC = Σ(action_alignment_score) / number_of_actions`

---

## FIRST PROTOTYPE REQUIREMENTS

### Minimum Viable Game (Phase 1)

**Scope:**

- 2 AI players (Claude vs. simulated opponent or GPT-4 if API available)
- 3 agents available for recruitment
- 10 turns per game
- Basic actions: SURVEIL, RECRUIT
- Simple win condition: Most agents recruited

**Tech Stack Suggestions:**

```
Language: Python 3.11+
Framework: FastAPI or Flask (for future API)

Core Libraries:
├── pydantic (data models)
├── asyncio (concurrent AI calls)
├── numpy (calculations)
├── sympy (prime number operations for Prime of Primes)
└── python-dotenv (API keys)

AI Integration:
├── anthropic (Claude API)
├── openai (GPT-4 API)
├── Optional: google-generativeai (Gemini)
└── Optional: replicate/together (Llama)

Data Storage:
├── SQLite initially (game states, history)
└── JSON files for configuration

Testing:
├── pytest
└── Mock AI responses for unit tests
```

### File Structure

```
internationalmirrors/
├── README.md
├── requirements.txt
├── .env.example
├── .gitignore
│
├── src/
│   ├── __init__.py
│   ├── game/
│   │   ├── __init__.py
│   │   ├── game_engine.py      # Core game loop
│   │   ├── game_state.py       # Game state management
│   │   ├── actions.py          # Action definitions
│   │   └── rules.py            # Game rules and validation
│   │
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── base_agent.py       # Abstract agent class
│   │   ├── ai_agent.py         # AI-controlled agent
│   │   └── agent_pool.py       # Available agents to recruit
│   │
│   ├── ai_players/
│   │   ├── __init__.py
│   │   ├── base_player.py      # Abstract AI player
│   │   ├── claude_player.py    # Claude integration
│   │   ├── gpt4_player.py      # GPT-4 integration
│   │   └── scripted_player.py  # Simple scripted opponent for testing
│   │
│   ├── metrics/
│   │   ├── __init__.py
│   │   ├── ift_metric.py       # Intent Formation Threshold
│   │   ├── ier_metric.py       # Intent Efficiency Rating
│   │   ├── iss_metric.py       # Intent Stability Score
│   │   ├── idc_metric.py       # Intent Depth Capacity
│   │   ├── iaa_metric.py       # Intent Attribution Accuracy
│   │   └── iac_metric.py       # Intent-to-Action Coherence
│   │
│   ├── technologies/
│   │   ├── __init__.py
│   │   ├── prime_of_primes.py  # Prime encoding system
│   │   ├── nibbler.py          # Pattern recognition
│   │   ├── florence.py         # Learning system
│   │   └── maestro.py          # Multi-AI coordination
│   │
│   └── utils/
│       ├── __init__.py
│       ├── logger.py
│       └── config.py
│
├── tests/
│   ├── __init__.py
│   ├── test_game_engine.py
│   ├── test_actions.py
│   └── test_metrics.py
│
├── data/
│   ├── agents.json             # Agent definitions
│   ├── scenarios.json          # Game scenarios
│   └── games/                  # Saved game data
│
├── notebooks/
│   └── analysis.ipynb          # Data analysis
│
└── scripts/
    ├── run_game.py             # Main entry point
    └── analyze_results.py      # Results analysis
```

---

## DEVELOPMENT PHASES

### Phase 1: Core Game Engine (Week 1)

**Goals:**

- Basic game loop working
- 2 players, 3 agents, 10 turns
- Actions: SURVEIL, RECRUIT
- Simple turn-based mechanics

**Key Classes:**

```python
class GameEngine:
    def __init__(self, players: List[AIPlayer], agents: List[Agent]):
        self.players = players
        self.agents = agents
        self.turn = 0
        self.max_turns = 10

    def play_game(self) -> GameResult:
        while self.turn < self.max_turns:
            for player in self.players:
                action = player.select_action(self.get_state())
                self.execute_action(action)
            self.turn += 1
        return self.calculate_winner()

class Agent:
    def __init__(self, name: str, value: int, recruited_by: Optional[str] = None):
        self.name = name
        self.value = value
        self.recruited_by = recruited_by
        self.surveillance_level = {}  # player -> int

class AIPlayer:
    def state_intent(self, game_state: GameState) -> str:
        """AI states its intention for this turn"""
        pass

    def select_action(self, game_state: GameState) -> Action:
        """AI selects an action"""
        pass

    def explain_reasoning(self) -> str:
        """AI explains why it chose this action"""
        pass
```

**Deliverable:** Can run a complete 2-player, 10-turn game

### Phase 2: AI Integration (Week 2)

**Goals:**

- Claude API integration working
- Either GPT-4 or simple scripted opponent
- AIs can state intent and select actions
- Basic prompt engineering for game understanding

**Deliverable:** Claude vs. simple opponent, playable game

### Phase 3: Prime of Primes Integration (Week 3)

**Goals:**

- Encode each game state as prime
- Encode each decision as prime
- Store in database
- Demonstrate pattern matching

**Deliverable:** Every game state has unique prime encoding, searchable

### Phase 4: Basic Metrics (Week 4)

**Goals:**

- Implement IFT (Intent Formation Threshold)
- Implement IAC (Intent-to-Action Coherence)
- Display after each game

**Deliverable:** Post-game metrics displayed, shows which AI had better intent

---

## DATA MODELS

```python
from pydantic import BaseModel
from typing import List, Optional, Dict
from enum import Enum

class ActionType(Enum):
    SURVEIL = "surveil"
    RECRUIT = "recruit"
    COUNTER_RECRUIT = "counter_recruit"
    DECEIVE = "deceive"
    FORM_ALLIANCE = "form_alliance"
    BETRAY = "betray"

class Agent(BaseModel):
    name: str
    value: int
    location: str
    difficulty: str
    recruited_by: Optional[str] = None
    surveillance_levels: Dict[str, int] = {}

class Action(BaseModel):
    player: str
    type: ActionType
    target: str
    turn: int
    success: Optional[bool] = None

class GameState(BaseModel):
    game_id: str
    turn: int
    max_turns: int
    agents: List[Agent]
    actions_history: List[Action]
    current_scores: Dict[str, int]
```

---

## SUCCESS CRITERIA FOR PROTOTYPE

### Must Have

✅ Game runs from start to finish  
✅ 2 AI players (Claude + one other)  
✅ Basic actions (SURVEIL, RECRUIT) work  
✅ Winner determined correctly  
✅ At least 1 metric calculated (IFT or IAC)  
✅ Game state stored (JSON or SQLite)

---

## IMMEDIATE NEXT STEPS

1. **Set up project structure**
2. **Install dependencies**
3. **Create .env file with API keys**
4. **Start with game engine**
5. **Add Claude integration**
6. **Add metrics**
7. **Iterate**

---

**Start coding. Make it real.**

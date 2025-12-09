# AAIP Swarm Orchestration System

**AI Agent Swarm Orchestration with Capability-Based Summoning and Multi-Agent Collaboration**

Inspired by BMad Method's prompt machine architecture, integrated with AAIP (AI Agent Identity Protocol) for verifiable agent identities and ConductMe's Trust Bridge for human authorization.

## 🎯 Overview

The AAIP Swarm Orchestrator enables:
- **Capability-Based Summoning**: Find and summon agents based on required capabilities
- **Multi-Agent Collaboration**: Agents work together in sequential, parallel, party, or workflow modes
- **Agent Personas**: BMad-style persona/activation system for rich agent behavior
- **Workflow Execution**: Structured workflows with agent coordination
- **Human Authorization**: Integration with ConductMe Trust Bridge for human-gated actions

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AAIP SWARM ORCHESTRATOR                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐                                              │
│   │   Human      │  (Semaphore Identity via ConductMe)         │
│   │  Operator    │                                              │
│   └──────┬───────┘                                              │
│          │                                                      │
│          │ 1. Summon Request                                    │
│          ▼                                                      │
│   ┌──────────────────────────────────────┐                     │
│   │   Swarm Orchestrator                 │                     │
│   │  - Capability Matching               │                     │
│   │  - Agent Selection                   │                     │
│   │  - Collaboration Setup               │                     │
│   └──────────────┬───────────────────────┘                     │
│                  │                                              │
│                  │ 2. Select Agents                             │
│                  ▼                                              │
│   ┌──────────────────────────────────────┐                     │
│   │   AAIP Agent Registry                │                     │
│   │  - Agent Identities (DIDs)          │                     │
│   │  - Capabilities                      │                     │
│   │  - Reputation                        │                     │
│   └──────────────┬───────────────────────┘                     │
│                  │                                              │
│                  │ 3. Execute Collaboration                   │
│                  ▼                                              │
│   ┌──────────────────────────────────────┐                     │
│   │   Agent Swarm                        │                     │
│   │  - Agent 1 (Architect)              │                     │
│   │  - Agent 2 (Developer)              │                     │
│   │  - Agent 3 (Tester)                 │                     │
│   │  - ...                               │                     │
│   └──────────────────────────────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Register an Agent with Persona

```python
from identity.swarm_orchestrator import (
    SwarmOrchestrator,
    AgentPersona,
    AgentActivation,
    AgentCommand,
    get_orchestrator,
)

# Get orchestrator
orchestrator = get_orchestrator()

# Define persona
persona = AgentPersona(
    role="Senior Software Architect",
    identity="Expert in distributed systems and microservices",
    communication_style="Technical, precise, solution-oriented",
    principles=[
        "Always consider scalability",
        "Security first",
        "Document decisions",
    ],
    icon="🏗️",
)

# Define activation
activation = AgentActivation(
    critical_actions=[
        "Analyze system requirements",
        "Design architecture",
        "Review implementation",
    ],
    menu=[
        {
            "trigger": "design-architecture",
            "action": "Design system architecture",
            "description": "Create architecture design",
        },
    ],
)

# Register persona for existing AAIP agent
orchestrator.register_agent_persona(
    agent_id="agent_abc123...",
    persona=persona,
    activation=activation,
)
```

### 2. Summon Agents for a Task

```python
from identity.swarm_orchestrator import SummonRequest, CollaborationMode

# Create summon request
request = SummonRequest(
    task_description="Design and implement a secure authentication system",
    required_capabilities=["code_generation", "reasoning", "tool_use"],
    collaboration_mode=CollaborationMode.SEQUENTIAL,
    max_agents=3,
    context={
        "project_type": "web_application",
        "security_level": "high",
    },
)

# Summon agents (with human authorization)
result = orchestrator.summon_agents(
    request=request,
    human_identity="0x123...",  # Semaphore commitment from ConductMe
)

print(f"Summoned {len(result['agents'])} agents")
print(f"Collaboration ID: {result['collaboration_id']}")
```

### 3. Execute Collaboration

```python
# Execute the collaboration
execution_result = orchestrator.execute_collaboration(
    collaboration_id=result['collaboration_id'],
    input_data={
        "requirements": "Secure JWT-based auth with 2FA",
        "tech_stack": ["Node.js", "PostgreSQL"],
    },
)

print(f"Results: {execution_result['results']}")
```

## 📋 Collaboration Modes

### Sequential Mode
Agents work one after another, passing output to the next agent.

```python
request = SummonRequest(
    task_description="Build a feature",
    required_capabilities=["code_generation"],
    collaboration_mode=CollaborationMode.SEQUENTIAL,
)
```

### Parallel Mode
Agents work simultaneously, results are combined.

```python
request = SummonRequest(
    task_description="Review code from multiple perspectives",
    required_capabilities=["code_generation", "reasoning"],
    collaboration_mode=CollaborationMode.PARALLEL,
)
```

### Party Mode
All agents collaborate in a group chat (inspired by BMad party-mode).

```python
request = SummonRequest(
    task_description="Brainstorm solution",
    required_capabilities=["reasoning", "tool_use"],
    collaboration_mode=CollaborationMode.PARTY,
)
```

### Workflow Mode
Agents follow a structured workflow with defined steps.

```python
request = SummonRequest(
    task_description="Execute development workflow",
    required_capabilities=["code_generation", "reasoning"],
    collaboration_mode=CollaborationMode.WORKFLOW,
    context={
        "workflow": {
            "steps": [
                {"n": 1, "type": "analysis", "agent_id": "agent_1"},
                {"n": 2, "type": "design", "agent_id": "agent_2"},
                {"n": 3, "type": "implementation", "agent_id": "agent_3"},
            ],
        },
    },
)
```

## 🔧 API Endpoints

### Register Agent Persona
```bash
POST /swarm/agent/persona/register
{
  "agent_id": "agent_abc123...",
  "persona": {
    "role": "Senior Architect",
    "identity": "...",
    "communication_style": "...",
    "principles": [...],
    "icon": "🏗️"
  },
  "activation": {...},
  "commands": [...]
}
```

### Summon Agents
```bash
POST /swarm/agents/summon
{
  "task_description": "Design secure auth system",
  "required_capabilities": ["code_generation", "reasoning"],
  "collaboration_mode": "sequential",
  "max_agents": 3,
  "human_identity": "0x123..."  # Optional: Semaphore commitment
}
```

### Execute Collaboration
```bash
POST /swarm/collaboration/execute
{
  "collaboration_id": "collab_abc123...",
  "input_data": {
    "requirements": "...",
    "context": {...}
  }
}
```

### List Available Agents
```bash
GET /swarm/agents/list
```

## 📁 Configuration Files

### Agent Configuration (YAML)

```yaml
agent:
  metadata:
    id: "agent_abc123..."
    name: "Architect Agent"

persona:
  role: "Senior Software Architect"
  identity: "Expert in distributed systems"
  communication_style: "Technical, precise"
  principles:
    - "Scalability first"
    - "Security by design"
  icon: "🏗️"

activation:
  critical_actions:
    - "Analyze requirements"
    - "Design architecture"
  menu:
    - trigger: "design"
      action: "Design system architecture"
      description: "Create architecture design"

menu:
  - trigger: "design-architecture"
    workflow: "architecture-design.yaml"
    description: "Design system architecture"
```

Load configuration:
```python
from identity.agent_config import AgentConfigLoader, get_orchestrator

orchestrator = get_orchestrator()
AgentConfigLoader.load_and_register(
    config_path="agent-config.yaml",
    agent_id="agent_abc123...",
    orchestrator=orchestrator,
)
```

## 🔗 Integration with ConductMe

The swarm orchestrator integrates with ConductMe's Trust Bridge for human authorization:

```typescript
import { summonAgents } from '@/lib/swarm';
import { getOrCreateIdentity } from '@/lib/trustBridge';

// Get human identity (Semaphore commitment)
const identity = await getOrCreateIdentity();

// Summon agents with human authorization
const result = await summonAgents({
  task_description: "Design secure system",
  required_capabilities: ["code_generation"],
  human_identity: identity.commitment,  // Human authorization
});
```

## 🎨 Frontend Integration

```typescript
import { summonAndExecute, listAgents } from '@/lib/swarm';

// List available agents
const agents = await listAgents();

// Summon and execute in one call
const result = await summonAndExecute(
  {
    task_description: "Build feature",
    required_capabilities: ["code_generation"],
    collaboration_mode: "sequential",
  },
  {
    requirements: "...",
    context: {...},
  }
);
```

## 🔐 Security

- **AAIP Identity**: All agents have verifiable DIDs
- **Human Authorization**: ConductMe Trust Bridge integration
- **Capability Verification**: Agents prove capabilities via ZK proofs
- **Audit Trail**: All collaborations are logged

## 📚 Files

- `backend-python/identity/swarm_orchestrator.py` - Core orchestrator
- `backend-python/api/swarm_routes.py` - REST API endpoints
- `backend-python/identity/agent_config.py` - Configuration loader
- `conductme/src/lib/swarm.ts` - Frontend client

## 🚧 Future Enhancements

- [ ] Real agent API integration (currently simulated)
- [ ] Advanced reputation-based agent selection
- [ ] Workflow execution engine (BMad-style)
- [ ] Agent-to-agent direct communication
- [ ] Persistent collaboration state
- [ ] Agent marketplace/discovery

---

**Built for the sovereign AI future.** 🚀


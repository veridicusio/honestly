/**
 * AAIP Swarm Client
 * 
 * Client-side integration for the AAIP Swarm Orchestration system.
 * Enables summoning agents, executing collaborations, and managing agent personas.
 */

const SWARM_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface AgentPersona {
  role: string;
  identity: string;
  communication_style: string;
  principles: string[];
  memories: string[];
  icon: string;
}

export interface AgentCommand {
  trigger: string;
  action: string;
  description: string;
  handler_type: string;
  params?: Record<string, any>;
}

export interface SummonRequest {
  task_description: string;
  required_capabilities: string[];
  preferred_agents?: string[];
  collaboration_mode?: 'sequential' | 'parallel' | 'party' | 'workflow';
  max_agents?: number;
  context?: Record<string, any>;
  human_identity?: string; // Semaphore commitment
}

export interface CollaborationResult {
  success: boolean;
  collaboration_id?: string;
  agents?: any[];
  results?: any[];
  error?: string;
}

/**
 * Register agent persona with the swarm orchestrator
 */
export async function registerAgentPersona(
  agentId: string,
  persona: AgentPersona,
  activation?: any,
  commands?: AgentCommand[]
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${SWARM_API_BASE}/swarm/agent/persona/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: agentId,
        persona,
        activation,
        commands,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.detail || 'Registration failed' };
    }

    const data = await res.json();
    return { success: true, message: data.message };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

/**
 * Summon agents for a task
 */
export async function summonAgents(
  request: SummonRequest
): Promise<CollaborationResult> {
  try {
    const res = await fetch(`${SWARM_API_BASE}/swarm/agents/summon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.detail || 'Summoning failed' };
    }

    return await res.json();
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

/**
 * Execute a collaboration session
 */
export async function executeCollaboration(
  collaborationId: string,
  inputData: Record<string, any>
): Promise<CollaborationResult> {
  try {
    const res = await fetch(`${SWARM_API_BASE}/swarm/collaboration/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collaboration_id: collaborationId,
        input_data: inputData,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.detail || 'Execution failed' };
    }

    return await res.json();
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

/**
 * List all available agents
 */
export async function listAgents(): Promise<{
  success: boolean;
  agents?: any[];
  count?: number;
  error?: string;
}> {
  try {
    const res = await fetch(`${SWARM_API_BASE}/swarm/agents/list`);

    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.detail || 'List failed' };
    }

    return await res.json();
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get collaboration status
 */
export async function getCollaborationStatus(
  collaborationId: string
): Promise<{
  success: boolean;
  status?: string;
  agents?: string[];
  created_at?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${SWARM_API_BASE}/swarm/collaboration/${collaborationId}/status`);

    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.detail || 'Status check failed' };
    }

    return await res.json();
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

/**
 * Summon and execute in one call (convenience function)
 */
export async function summonAndExecute(
  request: SummonRequest,
  inputData: Record<string, any>
): Promise<CollaborationResult> {
  // Summon agents
  const summonResult = await summonAgents(request);
  
  if (!summonResult.success || !summonResult.collaboration_id) {
    return summonResult;
  }

  // Execute collaboration
  return executeCollaboration(summonResult.collaboration_id, inputData);
}


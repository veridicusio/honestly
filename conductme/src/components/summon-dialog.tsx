"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
// Using native select for simplicity
import { summonAgents, listAgents } from '@/lib/swarm';
import { getOrCreateIdentity } from '@/lib/trustBridge';
import { Sparkles, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface SummonDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SummonDialog({ trigger, open: controlledOpen, onOpenChange: controlledOnOpenChange }: SummonDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const [taskDescription, setTaskDescription] = useState('');
  const [requiredCapabilities, setRequiredCapabilities] = useState<string[]>([]);
  const [collaborationMode, setCollaborationMode] = useState<'sequential' | 'parallel' | 'party' | 'workflow'>('sequential');
  const [maxAgents, setMaxAgents] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);

  const capabilityOptions = [
    'text_generation',
    'code_generation',
    'image_generation',
    'audio_generation',
    'reasoning',
    'tool_use',
    'web_browsing',
    'file_access',
    'memory',
    'multi_modal',
  ];

  const loadAgents = async () => {
    try {
      const res = await listAgents();
      if (res.success && res.agents) {
        setAvailableAgents(res.agents);
      }
    } catch (err) {
      console.error('Failed to load agents:', err);
    }
  };

  const handleSummon = async () => {
    if (!taskDescription.trim()) {
      setError('Please enter a task description');
      return;
    }

    if (requiredCapabilities.length === 0) {
      setError('Please select at least one capability');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get human identity for authorization
      const identity = await getOrCreateIdentity();

      const summonResult = await summonAgents({
        task_description: taskDescription,
        required_capabilities: requiredCapabilities,
        collaboration_mode: collaborationMode,
        max_agents: maxAgents,
        human_identity: identity.commitment,
      });

      if (summonResult.success) {
        setResult(summonResult);
      } else {
        setError(summonResult.error || 'Failed to summon agents');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to summon agents');
    } finally {
      setLoading(false);
    }
  };

  const toggleCapability = (capability: string) => {
    setRequiredCapabilities(prev =>
      prev.includes(capability)
        ? prev.filter(c => c !== capability)
        : [...prev, capability]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-blue-500 to-violet-600">
            <Sparkles className="mr-2 h-4 w-4" />
            Summon Swarm
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Summon AI Agent Swarm
          </DialogTitle>
          <DialogDescription>
            Describe your task and select required capabilities. Agents will be automatically selected and orchestrated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="task">Task Description *</Label>
            <Textarea
              id="task"
              placeholder="e.g., Design and implement a secure authentication system with 2FA"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Required Capabilities */}
          <div className="space-y-2">
            <Label>Required Capabilities *</Label>
            <div className="flex flex-wrap gap-2">
              {capabilityOptions.map((cap) => (
                <Badge
                  key={cap}
                  variant={requiredCapabilities.includes(cap) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCapability(cap)}
                >
                  {cap.replace('_', ' ')}
                </Badge>
              ))}
            </div>
            {requiredCapabilities.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Selected: {requiredCapabilities.join(', ')}
              </p>
            )}
          </div>

          {/* Collaboration Mode */}
          <div className="space-y-2">
            <Label htmlFor="mode">Collaboration Mode</Label>
            <select
              id="mode"
              value={collaborationMode}
              onChange={(e) => setCollaborationMode(e.target.value as any)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="sequential">Sequential (one after another)</option>
              <option value="parallel">Parallel (simultaneously)</option>
              <option value="party">Party Mode (group chat)</option>
              <option value="workflow">Workflow (structured steps)</option>
            </select>
          </div>

          {/* Max Agents */}
          <div className="space-y-2">
            <Label htmlFor="maxAgents">Maximum Agents</Label>
            <Input
              id="maxAgents"
              type="number"
              min={1}
              max={10}
              value={maxAgents}
              onChange={(e) => setMaxAgents(parseInt(e.target.value) || 1)}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-2 p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-semibold">Agents Summoned Successfully!</span>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>Collaboration ID:</strong> {result.collaboration_id}</p>
                <p><strong>Agents:</strong> {result.agents?.length || 0}</p>
                {result.agents && (
                  <ul className="list-disc list-inside ml-2">
                    {result.agents.map((agent: any, i: number) => (
                      <li key={i}>{agent.agent_name || agent.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSummon}
              disabled={loading || !taskDescription.trim() || requiredCapabilities.length === 0}
              className="bg-gradient-to-r from-blue-500 to-violet-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Summoning...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Summon Agents
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


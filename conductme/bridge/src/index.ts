/**
 * ConductMe Trust Bridge
 * 
 * Connects Honestly's ZK proofs to Semaphore identity for human-gated AI orchestration.
 * 
 * PRIVACY-PRESERVING FLOW (v2):
 * 1. Human proves age/authenticity via Honestly's Groth16 circuits
 * 2. User generates Semaphore identity CLIENT-SIDE (in browser)
 * 3. User creates binding commitment that ties Honestly proof to identity
 * 4. Server receives only: commitment + binding + proof (never the salt!)
 * 5. Every AI action requires a Semaphore proof (zero-knowledge, unlinkable)
 * 6. Actions are logged with proof verification for audit
 * 
 * @module @conductme/trust-bridge
 */

// Client-side identity (RECOMMENDED - privacy preserving)
export {
  ClientIdentity,
  RegistrationRequest,
  generateClientIdentity,
  createBindingCommitment,
  prepareRegistrationRequest,
  loadIdentityFromStorage,
  clearIdentityFromStorage,
  getOrCreateIdentity,
  exportIdentityForBackup,
  importIdentityFromBackup,
} from './client-identity.js';

// Server-side registration (privacy preserving)
export {
  PrivacyPreservingRegistrar,
  HonestlyNullifierRegistry,
  RegistrationResult,
  getDefaultRegistrar,
} from './server-registration.js';

// Legacy identity management (some functions deprecated)
export {
  ConductMeIdentity,
  SignalProof,
  createIdentity,
  recoverIdentity,
  deriveFromHonestlyProof, // @deprecated - use client-side generation
  ConductMeGroup,
  NullifierRegistry,
} from './identity.js';

// Orchestration
export {
  Conductor,
  ConductorConfig,
  AIAction,
  SignedAction,
  Actions,
} from './conductor.js';

// Re-export Semaphore types for convenience
export { Identity } from '@semaphore-protocol/identity';
export { Group } from '@semaphore-protocol/group';

/**
 * Quick start example:
 * 
 * ```typescript
 * import { Conductor, Actions } from '@conductme/trust-bridge';
 * 
 * // Initialize the conductor
 * const conductor = new Conductor({
 *   groupId: 'conductme-mainnet',
 *   allowedAIs: ['claude-3-opus', 'gpt-4-turbo', 'github-copilot'],
 * });
 * 
 * // Register a human (after they prove via Honestly)
 * const identity = await conductor.registerHuman(
 *   honestlyProofCommitment,
 *   userProvidedSalt
 * );
 * 
 * // Execute an AI action with human authorization
 * const signedAction = await conductor.executeAction(
 *   identity,
 *   Actions.query('claude-3-opus', 'Analyze this code for security issues')
 * );
 * 
 * // The signed action contains the proof
 * console.log(signedAction.humanVerified); // true
 * console.log(signedAction.proof.nullifierHash); // Unique per action
 * ```
 */


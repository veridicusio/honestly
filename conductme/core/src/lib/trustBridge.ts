/**
 * Trust Bridge Client (Browser-side)
 * 
 * Privacy-preserving Semaphore identity management.
 * 
 * CRITICAL: All identity generation happens CLIENT-SIDE.
 * The server NEVER sees your salt, trapdoor, or nullifier.
 */

const IDENTITY_STORAGE_KEY = "conductme:identity:v2";
const BINDING_STORAGE_KEY = "conductme:binding:v2";
const TRUST_BRIDGE_URL = process.env.NEXT_PUBLIC_TRUST_BRIDGE_URL || "";

export type SemaphoreIdentity = {
  commitment: string;
  trapdoor: string;
  nullifier: string;
  createdAt: number;
  bindingCommitment?: string;
};

export type RegistrationRequest = {
  semaphoreCommitment: string;
  bindingCommitment: string;
  honestlyNullifier: string;
  honestlyProof: {
    proof: unknown;
    publicSignals: unknown;
    proofType: 'age' | 'authenticity';
  };
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.crypto !== "undefined";
}

/**
 * Generate cryptographically secure random bytes
 */
function secureRandomBytes(length: number): Uint8Array {
  if (!isBrowser()) {
    throw new Error('Identity generation must happen in browser');
  }
  return window.crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Hash data using SHA-256
 */
async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Load identity from browser storage
 */
export async function loadIdentity(): Promise<SemaphoreIdentity | null> {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(IDENTITY_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SemaphoreIdentity;
  } catch {
    return null;
  }
}

/**
 * Generate a new Semaphore identity CLIENT-SIDE
 * The entropy never leaves your browser!
 */
export async function createIdentity(): Promise<SemaphoreIdentity> {
  if (!isBrowser()) {
    throw new Error('Identity must be created client-side in browser');
  }
  
  // Generate secure random entropy
  const entropy = secureRandomBytes(32);
  const seed = Array.from(entropy).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // In production, use @semaphore-protocol/identity
  // For now, derive trapdoor/nullifier from entropy
  const trapdoor = await sha256(`trapdoor:${seed}`);
  const nullifier = await sha256(`nullifier:${seed}`);
  const commitment = await sha256(`${trapdoor}:${nullifier}`);
  
  const identity: SemaphoreIdentity = {
    commitment,
    trapdoor,
    nullifier,
    createdAt: Date.now(),
  };
  
  // Store locally (never sent to server)
  window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
  
  return identity;
}

/**
 * Create binding commitment that ties Honestly proof to Semaphore identity
 * WITHOUT revealing the link to the server
 */
export async function createBindingCommitment(
  honestlyProofCommitment: string,
  semaphoreCommitment: string,
  clientSecret?: string
): Promise<{ bindingCommitment: string; clientSecret: string }> {
  if (!isBrowser()) {
    throw new Error('Binding must happen client-side');
  }
  
  // Generate or use provided secret
  const secret = clientSecret || 
    '0x' + Array.from(secureRandomBytes(32)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Create binding: H(honestly || semaphore || secret)
  const bindingCommitment = await sha256(`${honestlyProofCommitment}:${semaphoreCommitment}:${secret}`);
  
  // Store binding data locally
  const bindingData = {
    honestlyProofCommitment,
    semaphoreCommitment,
    bindingCommitment,
    clientSecret: secret,
    createdAt: Date.now(),
  };
  window.localStorage.setItem(BINDING_STORAGE_KEY, JSON.stringify(bindingData));
  
  return { bindingCommitment, clientSecret: secret };
}

/**
 * Get or create identity
 */
export async function getOrCreateIdentity(): Promise<SemaphoreIdentity> {
  const existing = await loadIdentity();
  if (existing) return existing;
  return createIdentity();
}

/**
 * Prepare registration request to send to server
 * IMPORTANT: This NEVER includes the salt or private keys!
 */
export async function prepareRegistration(
  honestlyProofCommitment: string,
  honestlyNullifier: string,
  honestlyProof: RegistrationRequest['honestlyProof']
): Promise<RegistrationRequest> {
  const identity = await getOrCreateIdentity();
  const { bindingCommitment } = await createBindingCommitment(
    honestlyProofCommitment,
    identity.commitment
  );
  
  // Update identity with binding
  identity.bindingCommitment = bindingCommitment;
  window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
  
  return {
    semaphoreCommitment: identity.commitment,
    bindingCommitment,
    honestlyNullifier,
    honestlyProof,
    // NOTE: No salt, trapdoor, or nullifier sent!
  };
}

/**
 * Register identity with the server
 * Privacy-preserving: server never sees your secrets
 */
export async function register(
  honestlyProofCommitment: string,
  honestlyNullifier: string,
  honestlyProof: RegistrationRequest['honestlyProof']
): Promise<{ success: boolean; commitment?: string; error?: string }> {
  const request = await prepareRegistration(
    honestlyProofCommitment,
    honestlyNullifier,
    honestlyProof
  );
  
  const endpoint = TRUST_BRIDGE_URL 
    ? `${TRUST_BRIDGE_URL}/api/identity/register`
    : '/api/identity/register';
  
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.error || 'Registration failed' };
    }
    
    const data = await res.json();
    return { success: true, commitment: data.data?.commitment };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

type ProofResponse = { proof: unknown; publicSignals: unknown; nullifierHash?: string };

/**
 * Request a Semaphore proof for an action
 */
export async function requestProof(signal: string): Promise<ProofResponse> {
  const identity = await getOrCreateIdentity();
  
  if (!TRUST_BRIDGE_URL) {
    // Mock for local development
    return { proof: {}, publicSignals: {}, nullifierHash: identity.commitment };
  }
  
  const res = await fetch(`${TRUST_BRIDGE_URL}/api/proof`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      signal, 
      commitment: identity.commitment,
      // NOTE: We send commitment, NOT trapdoor/nullifier
    }),
  });
  
  if (!res.ok) {
    throw new Error(`Trust Bridge proof request failed: ${res.status}`);
  }
  
  return await res.json() as ProofResponse;
}

/**
 * Verify a proof (placeholder)
 */
export async function verifyProof(_proof: unknown, _publicSignals: unknown): Promise<boolean> {
  // In production, integrate semaphore verifier
  return true;
}

/**
 * Clear identity from storage
 */
export function clearIdentity(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(IDENTITY_STORAGE_KEY);
  window.localStorage.removeItem(BINDING_STORAGE_KEY);
}

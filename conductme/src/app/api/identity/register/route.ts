import { NextResponse } from 'next/server';

/**
 * POST /api/identity/register
 * 
 * Privacy-Preserving Registration Endpoint
 * 
 * CRITICAL: This endpoint NEVER receives:
 * - The user's salt
 * - The user's Semaphore secrets (trapdoor, nullifier)
 * - Any way to link Honestly identity to Semaphore identity
 * 
 * It ONLY receives:
 * - semaphoreCommitment: Public identity commitment
 * - bindingCommitment: Cryptographic proof of link (without revealing it)
 * - honestlyNullifier: To prevent double-registration
 * - honestlyProof: To verify the user is human
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { 
      semaphoreCommitment, 
      bindingCommitment, 
      honestlyNullifier, 
      honestlyProof 
    } = body;
    
    // Validate required fields
    if (!semaphoreCommitment) {
      return NextResponse.json(
        { error: 'Missing semaphoreCommitment' },
        { status: 400 }
      );
    }
    
    if (!bindingCommitment) {
      return NextResponse.json(
        { error: 'Missing bindingCommitment' },
        { status: 400 }
      );
    }
    
    if (!honestlyNullifier) {
      return NextResponse.json(
        { error: 'Missing honestlyNullifier' },
        { status: 400 }
      );
    }
    
    if (!honestlyProof) {
      return NextResponse.json(
        { error: 'Missing honestlyProof' },
        { status: 400 }
      );
    }
    
    // SECURITY: Reject any request that includes a salt
    // This prevents accidental privacy leaks from old client code
    if ('salt' in body) {
      console.error('[SECURITY] Rejected registration request containing salt');
      return NextResponse.json(
        { error: 'Invalid request: salt should not be sent to server. Update your client.' },
        { status: 400 }
      );
    }
    
    // In production, this would use the PrivacyPreservingRegistrar
    // For now, simulate the registration
    const result = await simulatePrivacyPreservingRegistration({
      semaphoreCommitment,
      bindingCommitment,
      honestlyNullifier,
      honestlyProof,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      data: {
        commitment: semaphoreCommitment,
        groupId: result.groupId,
        merkleRoot: result.merkleRoot,
        memberIndex: result.memberIndex,
        verified: true,
        createdAt: new Date().toISOString(),
      },
      message: 'Identity registered successfully. Your Semaphore identity has been added to the group.',
    });
  } catch (error) {
    console.error('[API] Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Simulate privacy-preserving registration
 * In production, this would use the actual PrivacyPreservingRegistrar
 */
async function simulatePrivacyPreservingRegistration(request: {
  semaphoreCommitment: string;
  bindingCommitment: string;
  honestlyNullifier: string;
  honestlyProof: { proof: unknown; publicSignals: unknown; proofType: string };
}): Promise<{
  success: boolean;
  error?: string;
  groupId?: string;
  merkleRoot?: string;
  memberIndex?: number;
}> {
  // Simulated nullifier registry (in production, use persistent storage)
  const usedNullifiers = new Set<string>();
  
  // Check for double-registration
  if (usedNullifiers.has(request.honestlyNullifier)) {
    return {
      success: false,
      error: 'This Honestly proof has already been used to register an identity',
    };
  }
  
  // In production, verify the Honestly proof here
  // const verified = await verifyHonestlyProof(request.honestlyProof);
  // if (!verified) return { success: false, error: 'Invalid proof' };
  
  // Simulate successful registration
  const mockMerkleRoot = `0x${Buffer.from(request.semaphoreCommitment).toString('hex').slice(0, 64)}`;
  
  return {
    success: true,
    groupId: 'conductme-main',
    merkleRoot: mockMerkleRoot,
    memberIndex: Math.floor(Math.random() * 1000),
  };
}

/**
 * GET /api/identity/register
 * Check registration status
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const commitment = searchParams.get('commitment');
  
  if (!commitment) {
    return NextResponse.json(
      { error: 'Missing commitment parameter' },
      { status: 400 }
    );
  }
  
  // In production, check if commitment is in the group
  return NextResponse.json({
    data: {
      commitment,
      registered: true, // Simulated
      groupId: 'conductme-main',
    },
  });
}


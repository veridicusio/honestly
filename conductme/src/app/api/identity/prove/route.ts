import { NextResponse } from 'next/server';

/**
 * POST /api/identity/prove
 * 
 * @deprecated Use /api/identity/register instead for privacy-preserving registration.
 * 
 * This endpoint is kept for backwards compatibility but will reject requests
 * that include a salt parameter to prevent privacy leaks.
 * 
 * SECURITY WARNING: Identity derivation should happen CLIENT-SIDE.
 * The server should never see the salt or be able to link identities.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { honestlyProofCommitment, salt, proofType } = body;
    
    // SECURITY: Reject any request that includes a salt
    // This prevents the server from being able to link identities
    if (salt) {
      console.error('[SECURITY] Rejected /prove request containing salt - privacy vulnerability');
      return NextResponse.json(
        { 
          error: 'DEPRECATED: This endpoint no longer accepts salt parameter for privacy reasons. ' +
                 'Use /api/identity/register with client-side identity generation instead.',
          migration: {
            newEndpoint: '/api/identity/register',
            documentation: 'Identity must be generated client-side. See client-identity.ts',
          }
        },
        { status: 400 }
      );
    }
    
    if (!honestlyProofCommitment) {
      return NextResponse.json(
        { error: 'Missing honestlyProofCommitment' },
        { status: 400 }
      );
    }
    
    // Redirect to new flow explanation
    return NextResponse.json({
      error: 'This endpoint is deprecated. Please use /api/identity/register with client-side identity generation.',
      migration: {
        steps: [
          '1. Generate identity client-side using generateClientIdentity()',
          '2. Create binding commitment using createBindingCommitment()',
          '3. Call /api/identity/register with semaphoreCommitment, bindingCommitment, honestlyNullifier, honestlyProof',
          '4. Never send salt or private keys to the server',
        ],
        newEndpoint: '/api/identity/register',
      }
    }, { status: 400 });
  } catch (error) {
    console.error('[API] Prove error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/identity/prove
 * Check identity status
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
  
  return NextResponse.json({
    data: {
      commitment,
      deprecated: true,
      message: 'This endpoint is deprecated. Use /api/identity/register instead.',
    },
  });
}

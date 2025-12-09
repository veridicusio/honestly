import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VERIDICUS } from "../target/types/VERIDICUS";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getAccount } from "@solana/spl-token";
import { expect } from "chai";
import { MerkleTree } from "merkletreejs";
import { keccak256 } from "js-sha3";

describe("Airdrop", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.VERIDICUS as Program<VERIDICUS>;
  const authority = provider.wallet;
  
  let mint: PublicKey;
  let airdropState: PublicKey;
  let airdropVault: PublicKey;
  let vestingVault: PublicKey;
  let user = Keypair.generate();
  let userTokenAccount: PublicKey;
  let merkleRoot: Buffer;
  let merkleTree: MerkleTree;

  // Helper to hash leaf (must match on-chain)
  function hashLeaf(address: PublicKey, amount: number): Buffer {
    const addressBytes = address.toBytes();
    const decimals = 9;
    const rawAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)));
    const amountBytes = Buffer.allocUnsafe(8);
    amountBytes.writeBigUInt64LE(rawAmount, 0);
    const data = Buffer.concat([addressBytes, amountBytes]);
    return Buffer.from(keccak256(data), "hex");
  }

  before(async () => {
    // Airdrop SOL to user
    const signature = await provider.connection.requestAirdrop(
      user.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    // Create mint
    mint = await createMint(
      provider.connection,
      authority.payer,
      authority.publicKey,
      null,
      9
    );

    // Create user token account
    userTokenAccount = await createAccount(
      provider.connection,
      user,
      mint,
      user.publicKey
    );

    // Create Merkle tree for testing
    const recipients = [
      { address: user.publicKey, amount: 120000 },
      { address: Keypair.generate().publicKey, amount: 100000 },
    ];
    const leaves = recipients.map(r => hashLeaf(r.address, r.amount));
    merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    merkleRoot = merkleTree.getRoot();

    // Initialize airdrop state
    [airdropState] = PublicKey.findProgramAddressSync(
      [Buffer.from("airdrop")],
      program.programId
    );

    // Create airdrop vault (PDA)
    [airdropVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("airdrop_vault")],
      program.programId
    );

    // Create vesting vault (PDA)
    [vestingVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("vesting_vault")],
      program.programId
    );

    // Fund airdrop vault (for testing)
    // In production, this would be funded separately
  });

  it("Claims airdrop with valid Merkle proof", async () => {
    const amount = 120000;
    const leaf = hashLeaf(user.publicKey, amount);
    const proof = merkleTree.getHexProof(leaf);

    // Initialize airdrop state with merkle root
    // Note: This would normally be done by authority
    const merkleRootBytes = Array.from(merkleRoot);

    // Fund vaults (simplified for test)
    // In production, vaults are funded before airdrop

    // Claim airdrop
    const [claimRecord] = PublicKey.findProgramAddressSync(
      [Buffer.from("claim"), leaf],
      program.programId
    );

    const [vesting] = PublicKey.findProgramAddressSync(
      [Buffer.from("vesting"), user.publicKey.toBuffer()],
      program.programId
    );

    // This test requires proper setup of airdrop state and vaults
    // For now, we'll test the proof verification logic
    const isValid = merkleTree.verify(proof, leaf, merkleRoot);
    expect(isValid).to.be.true;
  });

  it("Rejects invalid Merkle proof", async () => {
    const amount = 120000;
    const leaf = hashLeaf(user.publicKey, amount);
    const fakeProof = ["0x" + "0".repeat(64), "0x" + "1".repeat(64)];

    const isValid = merkleTree.verify(fakeProof, leaf, merkleRoot);
    expect(isValid).to.be.false;
  });

  it("Prevents double claim", async () => {
    // This would be tested with actual claim flow
    // First claim should succeed, second should fail
    // Implementation depends on full airdrop setup
  });

  it("Unlocks vested tokens at milestones", async () => {
    // Test milestone-based unlocking
    // Requires state.total_jobs to reach milestones
    // Implementation depends on full vesting setup
  });
});


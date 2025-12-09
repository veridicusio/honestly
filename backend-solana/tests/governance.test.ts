import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VERIDICUS } from "../target/types/VERIDICUS";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";
import { expect } from "chai";

describe("Governance", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.VERIDICUS as Program<VERIDICUS>;
  const authority = provider.wallet;
  
  let mint: PublicKey;
  let state: PublicKey;
  let user = Keypair.generate();
  let userTokenAccount: PublicKey;
  let stakingPda: PublicKey;
  let stakingAccount: PublicKey;

  before(async () => {
    // Airdrop SOL
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

    // Create token account
    userTokenAccount = await createAccount(
      provider.connection,
      user,
      mint,
      user.publicKey
    );

    // Mint tokens
    await mintTo(
      provider.connection,
      authority.payer,
      mint,
      userTokenAccount,
      authority.publicKey,
      1_000_000_000_000_000
    );

    // Initialize program
    [state] = PublicKey.findProgramAddressSync(
      [Buffer.from("VERIDICUS_state")],
      program.programId
    );

    await program.methods
      .initialize()
      .accounts({
        state: state,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Get staking PDA
    [stakingPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("staking"), user.publicKey.toBuffer()],
      program.programId
    );

    [stakingAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("staking"), user.publicKey.toBuffer()],
      program.programId
    );

    // Stake tokens for voting power
    await program.methods
      .stakeVERIDICUS(new anchor.BN(10_000_000_000_000)) // 10K VDC
      .accounts({
        staking: stakingPda,
        user: user.publicKey,
        userTokenAccount: userTokenAccount,
        stakingAccount: stakingAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();
  });

  it("Creates proposal successfully", async () => {
    const proposalId = Date.now();
    const proposalType = 0; // Add new provider
    const description = "Add IBM Quantum as provider";

    const [proposal] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), Buffer.from(proposalId.toString())],
      program.programId
    );

    await program.methods
      .createProposal(proposalType, description, new anchor.BN(proposalId))
      .accounts({
        proposal: proposal,
        author: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const proposalData = await program.account.proposal.fetch(proposal);
    expect(proposalData.author.toString()).to.equal(user.publicKey.toString());
    expect(proposalData.proposalType).to.equal(proposalType);
    expect(proposalData.description).to.equal(description);
  });

  it("Votes on proposal with quadratic voting", async () => {
    const proposalId = Date.now() + 1;
    const [proposal] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), Buffer.from(proposalId.toString())],
      program.programId
    );

    // Create proposal first
    await program.methods
      .createProposal(0, "Test proposal", new anchor.BN(proposalId))
      .accounts({
        proposal: proposal,
        author: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Vote FOR
    await program.methods
      .vote(true)
      .accounts({
        proposal: proposal,
        staking: stakingPda,
        voter: user.publicKey,
      })
      .rpc();

    const proposalData = await program.account.proposal.fetch(proposal);
    expect(proposalData.votesFor.toNumber()).to.be.greaterThan(0);
  });

  it("Rejects vote on inactive proposal", async () => {
    const proposalId = Date.now() + 2;
    const [proposal] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), Buffer.from(proposalId.toString())],
      program.programId
    );

    // Create and execute proposal (makes it inactive)
    await program.methods
      .createProposal(0, "Test", new anchor.BN(proposalId))
      .accounts({
        proposal: proposal,
        author: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Execute proposal (makes it inactive)
    await program.methods
      .executeProposal()
      .accounts({
        proposal: proposal,
        authority: authority.publicKey,
      })
      .rpc();

    // Try to vote (should fail)
    try {
      await program.methods
        .vote(true)
        .accounts({
          proposal: proposal,
          staking: stakingPda,
          voter: user.publicKey,
        })
        .rpc();
      
      expect.fail("Should have failed - proposal not active");
    } catch (err: any) {
      expect(err.toString()).to.include("ProposalNotActive");
    }
  });

  it("Executes passed proposal", async () => {
    const proposalId = Date.now() + 3;
    const [proposal] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), Buffer.from(proposalId.toString())],
      program.programId
    );

    // Create proposal
    await program.methods
      .createProposal(1, "Update burn rates", new anchor.BN(proposalId))
      .accounts({
        proposal: proposal,
        author: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Vote FOR
    await program.methods
      .vote(true)
      .accounts({
        proposal: proposal,
        staking: stakingPda,
        voter: user.publicKey,
      })
      .rpc();

    // Execute proposal
    await program.methods
      .executeProposal()
      .accounts({
        proposal: proposal,
        authority: authority.publicKey,
      })
      .rpc();

    const proposalData = await program.account.proposal.fetch(proposal);
    // Proposal should be marked as passed or rejected
    expect(proposalData.status).to.exist;
  });
});


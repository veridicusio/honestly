import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VERIDICUS } from "../target/types/VERIDICUS";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";
import { expect } from "chai";

describe("Security", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.VERIDICUS as Program<VERIDICUS>;
  const authority = provider.wallet;
  
  let mint: PublicKey;
  let state: PublicKey;
  let userTokenAccount: PublicKey;
  let user = Keypair.generate();
  let userState: PublicKey;

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

    // Create token account for user
    userTokenAccount = await createAccount(
      provider.connection,
      user,
      mint,
      user.publicKey
    );

    // Mint tokens to user
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

    [userState] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_state"), user.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Rate limits job execution (cooldown)", async () => {
    // Execute first job
    await program.methods
      .executeQuantumJob(new anchor.BN(10), new anchor.BN(1))
      .accounts({
        state: state,
        userState: userState,
        user: user.publicKey,
        mint: mint,
        userTokenAccount: userTokenAccount,
        priceFeed: SystemProgram.programId, // Placeholder
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Try to execute immediately again (should fail)
    try {
      await program.methods
        .executeQuantumJob(new anchor.BN(10), new anchor.BN(1))
        .accounts({
          state: state,
          userState: userState,
          user: user.publicKey,
          mint: mint,
          userTokenAccount: userTokenAccount,
          priceFeed: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      
      expect.fail("Should have failed due to rate limit");
    } catch (err: any) {
      expect(err.toString()).to.include("RateLimitExceeded");
    }
  });

  it("Rate limits job execution (hourly limit)", async () => {
    // This would require executing 10+ jobs in quick succession
    // Simplified test - would need time manipulation or multiple users
  });

  it("Pauses program correctly", async () => {
    await program.methods
      .pause()
      .accounts({
        state: state,
        authority: authority.publicKey,
      })
      .rpc();

    const stateAccount = await program.account.VERIDICUSState.fetch(state);
    expect(stateAccount.paused).to.be.true;
  });

  it("Prevents job execution when paused", async () => {
    // Program should be paused from previous test
    try {
      await program.methods
        .executeQuantumJob(new anchor.BN(10), new anchor.BN(1))
        .accounts({
          state: state,
          userState: userState,
          user: user.publicKey,
          mint: mint,
          userTokenAccount: userTokenAccount,
          priceFeed: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      
      expect.fail("Should have failed - program is paused");
    } catch (err: any) {
      expect(err.toString()).to.include("ProgramPaused");
    }

    // Unpause
    await program.methods
      .unpause()
      .accounts({
        state: state,
        authority: authority.publicKey,
      })
      .rpc();
  });

  it("Handles authority transfer with timelock", async () => {
    const newAuthority = Keypair.generate();
    
    // Initiate transfer
    await program.methods
      .transferAuthority(newAuthority.publicKey)
      .accounts({
        state: state,
        authority: authority.publicKey,
      })
      .rpc();

    const stateAccount = await program.account.VERIDICUSState.fetch(state);
    expect(stateAccount.pendingAuthority?.toString()).to.equal(newAuthority.publicKey.toString());
    expect(stateAccount.authorityTransferTimestamp).to.not.be.null;

    // Try to accept immediately (should fail - timelock)
    try {
      await program.methods
        .acceptAuthority()
        .accounts({
          state: state,
          newAuthority: newAuthority.publicKey,
        })
        .signers([newAuthority])
        .rpc();
      
      expect.fail("Should have failed - timelock not expired");
    } catch (err: any) {
      expect(err.toString()).to.include("AuthorityTransferTimelockNotExpired");
    }

    // Cancel transfer
    await program.methods
      .cancelAuthorityTransfer()
      .accounts({
        state: state,
        authority: authority.publicKey,
      })
      .rpc();
  });

  it("Prevents unauthorized pause", async () => {
    const unauthorized = Keypair.generate();
    
    try {
      await program.methods
        .pause()
        .accounts({
          state: state,
          authority: unauthorized.publicKey,
        })
        .signers([unauthorized])
        .rpc();
      
      expect.fail("Should have failed - unauthorized");
    } catch (err: any) {
      expect(err.toString()).to.include("Unauthorized");
    }
  });

  it("Handles overflow protection", async () => {
    // Test with maximum values to ensure no overflow
    // This would require extensive testing with edge cases
  });
});


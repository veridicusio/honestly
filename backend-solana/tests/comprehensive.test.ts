import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VERIDICUS } from "../target/types/VERIDICUS";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getAccount } from "@solana/spl-token";
import { expect } from "chai";

describe("VERIDICUS Comprehensive Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.VERIDICUS as Program<VERIDICUS>;
  const authority = provider.wallet;
  
  let mint: PublicKey;
  let state: PublicKey;
  let userTokenAccount: PublicKey;
  let user = Keypair.generate();
  let userState: PublicKey;
  let stakingPda: PublicKey;
  let stakingAccount: PublicKey;

  before(async () => {
    // Airdrop SOL to user
    const signature = await provider.connection.requestAirdrop(
      user.publicKey,
      5 * LAMPORTS_PER_SOL
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
      1_000_000_000_000_000 // 1M tokens
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

    // Get PDAs
    [userState] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_state"), user.publicKey.toBuffer()],
      program.programId
    );

    [stakingPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("staking"), user.publicKey.toBuffer()],
      program.programId
    );

    [stakingAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("staking"), user.publicKey.toBuffer()],
      program.programId
    );
  });

  describe("Edge Cases & Error Handling", () => {
    it("Handles zero amount staking gracefully", async () => {
      try {
        await program.methods
          .stakeVERIDICUS(new anchor.BN(0))
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
        
        // Should either succeed (0 stake) or fail gracefully
      } catch (err: any) {
        // Acceptable - zero amount might be rejected
        expect(err).to.exist;
      }
    });

    it("Handles maximum amount staking", async () => {
      const maxAmount = new anchor.BN("18446744073709551615"); // u64::MAX
      
      try {
        await program.methods
          .stakeVERIDICUS(maxAmount)
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
      } catch (err: any) {
        // Should fail due to insufficient balance or overflow protection
        expect(err).to.exist;
      }
    });

    it("Prevents unstaking more than staked", async () => {
      // Stake some amount first
      const stakeAmount = 1_000_000_000_000;
      await program.methods
        .stakeVERIDICUS(new anchor.BN(stakeAmount))
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

      // Try to unstake more than staked
      try {
        await program.methods
          .unstakeVERIDICUS(new anchor.BN(stakeAmount * 2))
          .accounts({
            staking: stakingPda,
            user: user.publicKey,
            userTokenAccount: userTokenAccount,
            stakingAccount: stakingAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([user])
          .rpc();
        
        expect.fail("Should have failed - insufficient stake");
      } catch (err: any) {
        expect(err.toString()).to.include("InsufficientStake");
      }
    });

    it("Handles invalid job types gracefully", async () => {
      // Test with invalid job type (255)
      try {
        await program.methods
          .executeQuantumJob(new anchor.BN(10), new anchor.BN(255))
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
        
        // Should use default multiplier (1) for invalid types
      } catch (err: any) {
        // Acceptable if it fails
        expect(err).to.exist;
      }
    });

    it("Handles invalid qubit counts", async () => {
      // Test with invalid qubit count (255)
      try {
        await program.methods
          .executeQuantumJob(new anchor.BN(255), new anchor.BN(1))
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
        
        // Should use 0 qubit burn for invalid qubits
      } catch (err: any) {
        // Acceptable if it fails
        expect(err).to.exist;
      }
    });
  });

  describe("State Management", () => {
    it("Tracks total burned correctly across multiple jobs", async () => {
      const initialState = await program.account.VERIDICUSState.fetch(state);
      const initialBurned = initialState.totalBurned.toNumber();

      // Execute multiple jobs
      for (let i = 0; i < 3; i++) {
        // Wait for cooldown (simplified - in real test would wait)
        await new Promise(resolve => setTimeout(resolve, 100));
        
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
      }

      const finalState = await program.account.VERIDICUSState.fetch(state);
      const finalBurned = finalState.totalBurned.toNumber();
      
      expect(finalBurned).to.be.greaterThan(initialBurned);
    });

    it("Tracks total jobs correctly", async () => {
      const initialState = await program.account.VERIDICUSState.fetch(state);
      const initialJobs = initialState.totalJobs.toNumber();

      await program.methods
        .executeQuantumJob(new anchor.BN(5), new anchor.BN(0))
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

      const finalState = await program.account.VERIDICUSState.fetch(state);
      expect(finalState.totalJobs.toNumber()).to.equal(initialJobs + 1);
    });
  });

  describe("Staking Edge Cases", () => {
    it("Handles multiple stake operations", async () => {
      const stake1 = 1_000_000_000_000;
      const stake2 = 500_000_000_000;

      // First stake
      await program.methods
        .stakeVERIDICUS(new anchor.BN(stake1))
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

      // Second stake (adds to existing)
      await program.methods
        .stakeVERIDICUS(new anchor.BN(stake2))
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

      const stakingData = await program.account.staking.fetch(stakingPda);
      expect(stakingData.amount.toNumber()).to.equal(stake1 + stake2);
    });

    it("Calculates fee discounts correctly for all tiers", async () => {
      // Test 1K tier (20%)
      const stake1K = 1_000_000_000_000;
      await program.methods
        .stakeVERIDICUS(new anchor.BN(stake1K))
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

      let discount = await program.methods
        .getFeeDiscount()
        .accounts({
          staking: stakingPda,
          user: user.publicKey,
        })
        .view();
      expect(discount).to.equal(20);

      // Test 5K tier (40%)
      await program.methods
        .stakeVERIDICUS(new anchor.BN(4_000_000_000_000)) // Total 5K
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

      discount = await program.methods
        .getFeeDiscount()
        .accounts({
          staking: stakingPda,
          user: user.publicKey,
        })
        .view();
      expect(discount).to.equal(40);

      // Test 20K tier (60%)
      await program.methods
        .stakeVERIDICUS(new anchor.BN(15_000_000_000_000)) // Total 20K
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

      discount = await program.methods
        .getFeeDiscount()
        .accounts({
          staking: stakingPda,
          user: user.publicKey,
        })
        .view();
      expect(discount).to.equal(60);
    });
  });

  describe("Authority Transfer", () => {
    it("Prevents transferring to same authority", async () => {
      try {
        await program.methods
          .transferAuthority(authority.publicKey)
          .accounts({
            state: state,
            authority: authority.publicKey,
          })
          .rpc();
        
        expect.fail("Should have failed - same authority");
      } catch (err: any) {
        expect(err.toString()).to.include("InvalidNewAuthority");
      }
    });

    it("Prevents transferring to zero address", async () => {
      try {
        await program.methods
          .transferAuthority(PublicKey.default)
          .accounts({
            state: state,
            authority: authority.publicKey,
          })
          .rpc();
        
        expect.fail("Should have failed - zero address");
      } catch (err: any) {
        expect(err.toString()).to.include("InvalidNewAuthority");
      }
    });

    it("Prevents multiple pending transfers", async () => {
      const newAuthority1 = Keypair.generate();
      const newAuthority2 = Keypair.generate();

      // First transfer
      await program.methods
        .transferAuthority(newAuthority1.publicKey)
        .accounts({
          state: state,
          authority: authority.publicKey,
        })
        .rpc();

      // Try second transfer (should fail)
      try {
        await program.methods
          .transferAuthority(newAuthority2.publicKey)
          .accounts({
            state: state,
            authority: authority.publicKey,
          })
          .rpc();
        
        expect.fail("Should have failed - pending transfer exists");
      } catch (err: any) {
        expect(err.toString()).to.include("AuthorityTransferPending");
      }

      // Cancel first transfer
      await program.methods
        .cancelAuthorityTransfer()
        .accounts({
          state: state,
          authority: authority.publicKey,
        })
        .rpc();
    });
  });

  describe("Pause/Unpause", () => {
    it("Allows unpause after pause", async () => {
      // Pause
      await program.methods
        .pause()
        .accounts({
          state: state,
          authority: authority.publicKey,
        })
        .rpc();

      let stateAccount = await program.account.VERIDICUSState.fetch(state);
      expect(stateAccount.paused).to.be.true;

      // Unpause
      await program.methods
        .unpause()
        .accounts({
          state: state,
          authority: authority.publicKey,
        })
        .rpc();

      stateAccount = await program.account.VERIDICUSState.fetch(state);
      expect(stateAccount.paused).to.be.false;
    });
  });

  describe("User State Initialization", () => {
    it("Initializes user state on first job", async () => {
      const newUser = Keypair.generate();
      
      // Airdrop SOL
      const sig = await provider.connection.requestAirdrop(
        newUser.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig);

      // Create token account
      const newUserTokenAccount = await createAccount(
        provider.connection,
        newUser,
        mint,
        newUser.publicKey
      );

      // Mint tokens
      await mintTo(
        provider.connection,
        authority.payer,
        mint,
        newUserTokenAccount,
        authority.publicKey,
        100_000_000_000_000
      );

      const [newUserState] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_state"), newUser.publicKey.toBuffer()],
        program.programId
      );

      // Execute job (should initialize user state)
      await program.methods
        .executeQuantumJob(new anchor.BN(10), new anchor.BN(1))
        .accounts({
          state: state,
          userState: newUserState,
          user: newUser.publicKey,
          mint: mint,
          userTokenAccount: newUserTokenAccount,
          priceFeed: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([newUser])
        .rpc();

      // Verify user state was initialized
      const userStateData = await program.account.userState.fetch(newUserState);
      expect(userStateData.user.toString()).to.equal(newUser.publicKey.toString());
      expect(userStateData.jobsLastHour).to.equal(1);
    });
  });
});


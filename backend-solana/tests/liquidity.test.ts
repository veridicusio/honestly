import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VERIDICUS } from "../target/types/VERIDICUS";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount } from "@solana/spl-token";
import { expect } from "chai";

describe("Liquidity Lock", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.VERIDICUS as Program<VERIDICUS>;
  const authority = provider.wallet;
  
  let lpMint: PublicKey;
  let lpTokenAccount: PublicKey;
  let lock: PublicKey;

  before(async () => {
    // Create LP token mint (simulating Raydium LP token)
    lpMint = await createMint(
      provider.connection,
      authority.payer,
      authority.publicKey,
      null,
      9
    );

    // Create LP token account
    lpTokenAccount = await createAccount(
      provider.connection,
      authority.payer,
      lpMint,
      authority.publicKey
    );

    [lock] = PublicKey.findProgramAddressSync(
      [Buffer.from("liquidity_lock")],
      program.programId
    );
  });

  it("Locks liquidity for minimum 12 months", async () => {
    const clock = await provider.connection.getSlot();
    const currentTime = Date.now() / 1000;
    const unlockTime = currentTime + (12 * 30 * 24 * 60 * 60) + 86400; // 12 months + 1 day

    await program.methods
      .lockLiquidity(new anchor.BN(unlockTime))
      .accounts({
        lock: lock,
        lpTokenAccount: lpTokenAccount,
        authority: authority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const lockAccount = await program.account.liquidityLock.fetch(lock);
    expect(lockAccount.locked).to.be.true;
    expect(lockAccount.unlockTimestamp.toNumber()).to.be.greaterThan(currentTime);
  });

  it("Rejects lock period less than 12 months", async () => {
    const currentTime = Date.now() / 1000;
    const unlockTime = currentTime + (6 * 30 * 24 * 60 * 60); // 6 months (too short)

    try {
      await program.methods
        .lockLiquidity(new anchor.BN(unlockTime))
        .accounts({
          lock: lock,
          lpTokenAccount: lpTokenAccount,
          authority: authority.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      expect.fail("Should have failed - lock period too short");
    } catch (err: any) {
      expect(err.toString()).to.include("LockPeriodTooShort");
    }
  });

  it("Prevents unlock before expiry", async () => {
    // Lock should exist from previous test
    try {
      await program.methods
        .unlockLiquidity()
        .accounts({
          lock: lock,
          lpTokenAccount: lpTokenAccount,
          authorityTokenAccount: lpTokenAccount,
          authority: authority.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      
      expect.fail("Should have failed - lock not expired");
    } catch (err: any) {
      expect(err.toString()).to.include("LiquidityStillLocked");
    }
  });

  it("Checks lock status correctly", async () => {
    const isLocked = await program.methods
      .isLiquidityLocked()
      .accounts({
        lock: lock,
      })
      .view();

    expect(isLocked).to.be.true;
  });
});


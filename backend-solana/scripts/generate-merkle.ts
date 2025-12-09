import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { MerkleTree } from "merkletreejs";
import { keccak256 } from "js-sha3";
import * as fs from "fs";
import * as path from "path";
import * as csv from "csv-parse/sync";

/**
 * Generate Merkle tree for VERIDICUS airdrop
 * 
 * Usage: 
 *   ts-node scripts/generate-merkle.ts [airdrop-list.csv]
 * 
 * CSV format:
 *   address,amount
 *   7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU,120000
 *   9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM,120000
 */

interface AirdropRecipient {
  address: string;
  amount: number; // In VERIDICUS (not raw amount)
}

function loadRecipientsFromCSV(filePath: string): AirdropRecipient[] {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ CSV file not found: ${filePath}`);
    console.log("📝 Creating example CSV file...");
    
    // Create example CSV
    const exampleCSV = `address,amount
7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU,120000
9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM,120000`;
    
    fs.writeFileSync("airdrop-list.csv", exampleCSV);
    console.log("✅ Created example airdrop-list.csv");
    console.log("📝 Edit this file with your actual recipients and run again");
    process.exit(1);
  }
  
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const records = csv.parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  
  return records.map((r: any) => ({
    address: r.address.trim(),
    amount: parseFloat(r.amount),
  }));
}

function hashLeaf(address: string, amount: number): Buffer {
  // Convert address to bytes (base58 decode to 32 bytes)
  const addressBytes = new PublicKey(address).toBytes();
  
  // Convert amount to u64 (8 bytes, little-endian)
  const decimals = 9;
  const rawAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)));
  const amountBytes = Buffer.allocUnsafe(8);
  amountBytes.writeBigUInt64LE(rawAmount, 0);
  
  // Hash: keccak256(address || amount)
  // This must match the on-chain verification in airdrop.rs
  const data = Buffer.concat([addressBytes, amountBytes]);
  const hash = keccak256(data);
  return Buffer.from(hash, "hex");
}

function generateMerkleTree(recipients: AirdropRecipient[]): {
  tree: MerkleTree;
  root: string;
  proofs: Map<string, string[]>;
} {
  const leaves = recipients.map((r) => hashLeaf(r.address, r.amount));
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = tree.getHexRoot();

  const proofs = new Map<string, string[]>();
  recipients.forEach((recipient, index) => {
    const leaf = leaves[index];
    const proof = tree.getHexProof(leaf);
    proofs.set(recipient.address, proof);
  });

  return { tree, root, proofs };
}

async function main() {
  const csvPath = process.argv[2] || "airdrop-list.csv";
  
  console.log("🌳 Generating Merkle tree for VERIDICUS airdrop...");
  console.log(`📂 Loading recipients from: ${csvPath}`);
  
  const recipients = loadRecipientsFromCSV(csvPath);
  console.log(`✅ Loaded ${recipients.length} recipients`);

  // Validate addresses
  const invalidAddresses = recipients.filter(r => {
    try {
      new PublicKey(r.address);
      return false;
    } catch {
      return true;
    }
  });
  
  if (invalidAddresses.length > 0) {
    console.error(`❌ Invalid addresses found:`);
    invalidAddresses.forEach(r => console.error(`  - ${r.address}`));
    process.exit(1);
  }

  const { tree, root, proofs } = generateMerkleTree(recipients);

  // Save to file
  const output = {
    merkleRoot: root,
    totalRecipients: recipients.length,
    totalAmount: recipients.reduce((sum, r) => sum + r.amount, 0),
    recipients: recipients.map((r) => ({
      address: r.address,
      amount: r.amount,
      proof: proofs.get(r.address) || [],
    })),
  };

  const outputPath = "merkle-tree.json";
  fs.writeFileSync(
    outputPath,
    JSON.stringify(output, null, 2)
  );

  console.log("\n✅ Merkle tree generated!");
  console.log(`📊 Root: ${root}`);
  console.log(`📁 Saved to: ${outputPath}`);
  console.log(`👥 Recipients: ${recipients.length}`);
  console.log(`💰 Total amount: ${output.totalAmount.toLocaleString()} VERIDICUS`);
  
  // Save root separately for easy access
  fs.writeFileSync(
    "merkle-root.txt",
    root
  );
  console.log(`📄 Root saved to: merkle-root.txt`);
  
  console.log(`\n📝 Example proof for first recipient:`);
  if (recipients.length > 0) {
    const first = recipients[0];
    const proof = proofs.get(first.address) || [];
    console.log(`  Address: ${first.address}`);
    console.log(`  Amount: ${first.amount} VERIDICUS`);
    console.log(`  Proof: ${JSON.stringify(proof)}`);
  }
}

main().catch(console.error);


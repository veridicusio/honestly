import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { MerkleTree } from "merkletreejs";
import { keccak256 } from "js-sha3";
import * as fs from "fs";

/**
 * Generate Merkle tree for VERIDICUS airdrop
 * 
 * Usage: ts-node scripts/generate-merkle.ts
 */

interface AirdropRecipient {
  address: string;
  amount: number; // In VERIDICUS (not raw amount)
}

// Example recipients (replace with actual list)
const recipients: AirdropRecipient[] = [
  { address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", amount: 120000 },
  { address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", amount: 120000 },
  // Add more recipients...
];

function hashLeaf(address: string, amount: number): Buffer {
  const decimals = 9;
  const rawAmount = amount * Math.pow(10, decimals);
  
  const data = Buffer.concat([
    Buffer.from(address, "hex"),
    Buffer.from(rawAmount.toString(16).padStart(16, "0"), "hex"),
  ]);
  
  return Buffer.from(keccak256(data), "hex");
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
  console.log("🌳 Generating Merkle tree for VERIDICUS airdrop...");
  console.log(`Recipients: ${recipients.length}`);

  const { tree, root, proofs } = generateMerkleTree(recipients);

  // Save to file
  const output = {
    merkleRoot: root,
    totalRecipients: recipients.length,
    recipients: recipients.map((r) => ({
      address: r.address,
      amount: r.amount,
      proof: proofs.get(r.address),
    })),
  };

  fs.writeFileSync(
    "merkle-tree.json",
    JSON.stringify(output, null, 2)
  );

  console.log("✅ Merkle tree generated!");
  console.log(`Root: ${root}`);
  console.log(`Saved to: merkle-tree.json`);
  console.log(`\nTo verify a proof:`);
  console.log(`  const proof = ${JSON.stringify(proofs.get(recipients[0].address))};`);
  console.log(`  const leaf = hashLeaf("${recipients[0].address}", ${recipients[0].amount});`);
  console.log(`  const isValid = tree.verify(proof, leaf, root);`);
}

main().catch(console.error);


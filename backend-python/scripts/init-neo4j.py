#!/usr/bin/env python3
"""
Initialize Neo4j database with required constraints and indexes.
Run this once to set up your Neo4j database.

Usage:
    python scripts/init-neo4j.py

Or with custom credentials:
    NEO4J_URI=neo4j+s://... NEO4J_USER=neo4j NEO4J_PASS=... python scripts/init-neo4j.py
"""

import os
import sys
from py2neo import Graph

# Neo4j connection
NEO4J_URI = os.getenv("NEO4J_URI", "neo4j+s://138d4aa8.databases.neo4j.io:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASS = os.getenv("NEO4J_PASS", "NI2IG3T5blqKFHBMrl7HJEReIITtnnlkwCYC0xGgo6Y")

def main():
    print("🔗 Connecting to Neo4j...")
    print(f"   URI: {NEO4J_URI}")

    try:
        graph = Graph(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
        print("✅ Connected successfully!\n")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)

    # Test the connection
    try:
        result = graph.run("RETURN 1 as test").data()
        print(f"✅ Database test query successful: {result}\n")
    except Exception as e:
        print(f"❌ Test query failed: {e}")
        sys.exit(1)

    print("📊 Creating constraints and indexes...\n")

    constraints = [
        # User constraints
        ("User ID", "CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE"),

        # Claim constraints
        ("Claim ID", "CREATE CONSTRAINT claim_id_unique IF NOT EXISTS FOR (c:Claim) REQUIRE c.id IS UNIQUE"),

        # Nullifier constraints (prevent double-spending)
        ("Nullifier", "CREATE CONSTRAINT nullifier_hash_unique IF NOT EXISTS FOR (n:Nullifier) REQUIRE n.hash IS UNIQUE"),

        # Reputation proof constraints
        ("Reputation Proof ID", "CREATE CONSTRAINT agent_reputation_id IF NOT EXISTS FOR (r:ReputationProof) REQUIRE r.proof_id IS UNIQUE"),

        # Verification constraints
        ("Verification ID", "CREATE CONSTRAINT verification_id_unique IF NOT EXISTS FOR (v:Verification) REQUIRE v.id IS UNIQUE"),
    ]

    indexes = [
        # Agent reputation indexes
        ("Agent ID", "CREATE INDEX agent_reputation_agent IF NOT EXISTS FOR (r:ReputationProof) ON (r.agent_id)"),
        ("Reputation Time", "CREATE INDEX agent_reputation_time IF NOT EXISTS FOR (r:ReputationProof) ON (r.timestamp)"),

        # Claim indexes
        ("Claim Source", "CREATE INDEX claim_source_idx IF NOT EXISTS FOR (c:Claim) ON (c.source)"),
        ("Claim Time", "CREATE INDEX claim_time_idx IF NOT EXISTS FOR (c:Claim) ON (c.timestamp)"),

        # User indexes
        ("User Created", "CREATE INDEX user_created_idx IF NOT EXISTS FOR (u:User) ON (u.created_at)"),
    ]

    # Create constraints
    for name, query in constraints:
        try:
            graph.run(query)
            print(f"   ✅ {name}")
        except Exception as e:
            print(f"   ⚠️  {name}: {e}")

    print()

    # Create indexes
    for name, query in indexes:
        try:
            graph.run(query)
            print(f"   ✅ {name}")
        except Exception as e:
            print(f"   ⚠️  {name}: {e}")

    print("\n📈 Database statistics:")

    # Show current state
    try:
        # Count nodes by label
        labels_query = "CALL db.labels() YIELD label RETURN label"
        labels = graph.run(labels_query).data()

        if labels:
            print("\n   Node Labels:")
            for label_data in labels:
                label = label_data['label']
                count_query = f"MATCH (n:{label}) RETURN count(n) as count"
                count = graph.run(count_query).data()[0]['count']
                print(f"      {label}: {count} nodes")
        else:
            print("\n   No nodes yet (database is empty)")

        # Show constraints
        constraints_query = "SHOW CONSTRAINTS"
        try:
            constraints_result = graph.run(constraints_query).data()
            print(f"\n   Total Constraints: {len(constraints_result)}")
        except:
            print("\n   Constraints created (count unavailable)")

        # Show indexes
        indexes_query = "SHOW INDEXES"
        try:
            indexes_result = graph.run(indexes_query).data()
            print(f"   Total Indexes: {len(indexes_result)}")
        except:
            print("\n   Indexes created (count unavailable)")

    except Exception as e:
        print(f"   ⚠️  Could not get statistics: {e}")

    print("\n✨ Database initialization complete!")
    print("\n💡 Next steps:")
    print("   1. Deploy your backend with: .\\scripts\\deploy-gcp.ps1 -MapDomains")
    print("   2. Access your API at: https://api.veridicus.io")
    print("   3. Test with: https://api.veridicus.io/health")

if __name__ == "__main__":
    main()

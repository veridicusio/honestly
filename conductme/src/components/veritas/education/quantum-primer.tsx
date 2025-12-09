"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Cpu, Shield, TrendingUp } from 'lucide-react';

export function QuantumPrimer() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quantum Computing Primer</CardTitle>
          <CardDescription>Understanding quantum computing and why VERITAS uses it</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* What is Quantum Computing */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center space-x-2 mb-3">
              <Cpu className="h-5 w-5 text-blue-500" />
              <h3 className="font-medium">What is Quantum Computing?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Quantum computing uses quantum mechanical phenomena (superposition, entanglement) to perform computations that would be intractable for classical computers. Instead of bits (0 or 1), quantum computers use qubits that can exist in multiple states simultaneously.
            </p>
          </div>

          {/* Why VERITAS Uses It */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="h-5 w-5 text-violet-500" />
              <h3 className="font-medium">Why VERITAS Uses Quantum Computing</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              VERITAS leverages quantum computing for:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span><strong>zkML Proof Acceleration:</strong> Quantum circuits can accelerate zero-knowledge proof generation for machine learning models, reducing computation time from hours to minutes.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span><strong>Anomaly Detection:</strong> Quantum algorithms excel at pattern recognition, making them ideal for detecting anomalies in blockchain transactions and AI agent behavior.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span><strong>Circuit Optimization:</strong> Quantum simulators can optimize complex cryptographic circuits more efficiently than classical methods.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span><strong>Security Audits:</strong> Quantum computing enables more thorough analysis of smart contracts and cryptographic protocols.</span>
              </li>
            </ul>
          </div>

          {/* Job Types */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <h3 className="font-medium">Job Types Explained</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded bg-muted">
                <div className="font-medium text-sm mb-1">zkML Proof</div>
                <p className="text-xs text-muted-foreground">
                  Generate zero-knowledge proofs for ML model inference, enabling privacy-preserving AI verification.
                </p>
                <Badge variant="outline" className="mt-2 text-xs">~10 VTS</Badge>
              </div>
              <div className="p-3 rounded bg-muted">
                <div className="font-medium text-sm mb-1">Circuit Optimize</div>
                <p className="text-xs text-muted-foreground">
                  Optimize cryptographic circuits for efficiency, reducing gas costs and execution time.
                </p>
                <Badge variant="outline" className="mt-2 text-xs">~5 VTS</Badge>
              </div>
              <div className="p-3 rounded bg-muted">
                <div className="font-medium text-sm mb-1">Anomaly Detect</div>
                <p className="text-xs text-muted-foreground">
                  Detect anomalies in blockchain transactions or AI agent behavior using quantum pattern recognition.
                </p>
                <Badge variant="outline" className="mt-2 text-xs">~20 VTS</Badge>
              </div>
              <div className="p-3 rounded bg-muted">
                <div className="font-medium text-sm mb-1">Security Audit</div>
                <p className="text-xs text-muted-foreground">
                  Comprehensive security analysis of smart contracts and cryptographic protocols.
                </p>
                <Badge variant="outline" className="mt-2 text-xs">~50 VTS</Badge>
              </div>
            </div>
          </div>

          {/* Provider Differences */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="h-5 w-5 text-amber-500" />
              <h3 className="font-medium">Provider Differences</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-medium mb-1">Simulator (Current)</div>
                <p className="text-muted-foreground">
                  Classical computers simulating quantum behavior. Fast, reliable, and cost-effective for development and testing. Perfect for learning and prototyping.
                </p>
              </div>
              <div>
                <div className="font-medium mb-1">IBM Quantum (Future)</div>
                <p className="text-muted-foreground">
                  Real quantum hardware with 100+ qubits. Ideal for complex optimization problems and large-scale zkML proofs. Higher cost but true quantum advantage.
                </p>
              </div>
              <div>
                <div className="font-medium mb-1">Google Quantum AI (Future)</div>
                <p className="text-muted-foreground">
                  Advanced quantum processors with error correction. Best for research-grade computations and cutting-edge algorithms.
                </p>
              </div>
              <div>
                <div className="font-medium mb-1">IonQ (Future)</div>
                <p className="text-muted-foreground">
                  Trapped-ion quantum computers with high fidelity. Excellent for precise calculations and quantum chemistry simulations.
                </p>
              </div>
            </div>
          </div>

          {/* Democratization */}
          <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
            <h3 className="font-medium mb-2 text-primary">Democratizing Quantum Access</h3>
            <p className="text-sm text-muted-foreground">
              VERITAS makes quantum computing accessible to everyone. Instead of requiring expensive subscriptions or technical expertise, you simply pay with VERITAS tokens. This democratizes access to cutting-edge quantum resources, enabling developers, researchers, and businesses to leverage quantum computing without barriers.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


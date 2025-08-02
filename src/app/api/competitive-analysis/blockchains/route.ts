import { NextRequest, NextResponse } from 'next/server';

interface BlockchainData {
  name: string;
  logo: string;
  category: string;
  marketCap: number;
  tps: number;
  latency: number;
  securityScore: number;
  scalability: number;
  developerExperience: number;
  ecosystemSize: number;
  quantumResistance: boolean;
  dagArchitecture: boolean;
  features: Record<string, boolean>;
  strengths: string[];
  weaknesses: string[];
}

export async function GET(request: NextRequest) {
  try {
    const blockchains: BlockchainData[] = [
      {
        name: "KALDRIX",
        logo: "🛡️",
        category: "Quantum-Proof DAG",
        marketCap: 850000000,
        tps: 2847,
        latency: 2.1,
        securityScore: 98,
        scalability: 95,
        developerExperience: 88,
        ecosystemSize: 284750,
        quantumResistance: true,
        dagArchitecture: true,
        features: {
          smartContracts: true,
          defi: true,
          nft: true,
          crossChain: true,
          privacy: true,
          governance: true,
          staking: true,
          layer2: true,
          zkProofs: true,
          enterprise: true,
          mobileSdk: true,
          aiOptimization: true,
          quantumResistant: true,
          dagConsensus: true,
          interoperability: true
        },
        strengths: [
          "Quantum-resistant cryptography",
          "High-performance DAG consensus",
          "Enterprise-grade security",
          "Advanced privacy features",
          "Cross-chain interoperability"
        ],
        weaknesses: [
          "Smaller ecosystem compared to established chains",
          "Limited exchange listings",
          "Newer technology with less battle-testing",
          "Higher complexity for developers"
        ]
      },
      {
        name: "Ethereum",
        logo: "💎",
        category: "Smart Contract Platform",
        marketCap: 280000000000,
        tps: 15,
        latency: 15,
        securityScore: 92,
        scalability: 65,
        developerExperience: 95,
        ecosystemSize: 5000000,
        quantumResistance: false,
        dagArchitecture: false,
        features: {
          smartContracts: true,
          defi: true,
          nft: true,
          crossChain: true,
          privacy: false,
          governance: true,
          staking: true,
          layer2: true,
          zkProofs: true,
          enterprise: true,
          mobileSdk: true,
          aiOptimization: false,
          quantumResistant: false,
          dagConsensus: false,
          interoperability: true
        },
        strengths: [
          "Largest developer ecosystem",
          "Most DeFi applications",
          "Extensive tooling and documentation",
          "High network effect",
          "Strong community governance"
        ],
        weaknesses: [
          "Low TPS and high latency",
          "High gas fees",
          "Not quantum-resistant",
          "Energy intensive (pre-merge)",
          "Scalability challenges"
        ]
      },
      {
        name: "Solana",
        logo: "🌟",
        category: "High Performance L1",
        marketCap: 45000000000,
        tps: 65000,
        latency: 0.4,
        securityScore: 85,
        scalability: 90,
        developerExperience: 82,
        ecosystemSize: 1500000,
        quantumResistance: false,
        dagArchitecture: false,
        features: {
          smartContracts: true,
          defi: true,
          nft: true,
          crossChain: true,
          privacy: false,
          governance: true,
          staking: true,
          layer2: false,
          zkProofs: false,
          enterprise: true,
          mobileSdk: true,
          aiOptimization: false,
          quantumResistant: false,
          dagConsensus: false,
          interoperability: true
        },
        strengths: [
          "Very high TPS",
          "Low latency",
          "Low transaction costs",
          "Growing DeFi ecosystem",
          "Strong performance for gaming"
        ],
        weaknesses: [
          "Network stability issues",
          "Centralization concerns",
          "Not quantum-resistant",
          "Limited privacy features",
          "Validator hardware requirements"
        ]
      },
      {
        name: "Polkadot",
        logo: "🔗",
        category: "Multi-Chain Network",
        marketCap: 8500000000,
        tps: 1000,
        latency: 6,
        securityScore: 90,
        scalability: 88,
        developerExperience: 78,
        ecosystemSize: 800000,
        quantumResistance: false,
        dagArchitecture: false,
        features: {
          smartContracts: true,
          defi: true,
          nft: true,
          crossChain: true,
          privacy: true,
          governance: true,
          staking: true,
          layer2: true,
          zkProofs: true,
          enterprise: true,
          mobileSdk: true,
          aiOptimization: false,
          quantumResistant: false,
          dagConsensus: false,
          interoperability: true
        },
        strengths: [
          "Parachain architecture",
          "Cross-chain interoperability",
          "Shared security model",
          "Strong governance",
          "Upgradable runtime"
        ],
        weaknesses: [
          "Complex architecture",
          "Slower finality",
          "Not quantum-resistant",
          "Higher complexity for developers",
          "Limited parachain slots"
        ]
      },
      {
        name: "Cardano",
        logo: "🎴",
        category: "Academic Blockchain",
        marketCap: 12000000000,
        tps: 250,
        latency: 20,
        securityScore: 94,
        scalability: 75,
        developerExperience: 70,
        ecosystemSize: 1200000,
        quantumResistance: false,
        dagArchitecture: false,
        features: {
          smartContracts: true,
          defi: true,
          nft: true,
          crossChain: true,
          privacy: false,
          governance: true,
          staking: true,
          layer2: true,
          zkProofs: true,
          enterprise: true,
          mobileSdk: true,
          aiOptimization: false,
          quantumResistant: false,
          dagConsensus: false,
          interoperability: true
        },
        strengths: [
          "Peer-reviewed development",
          "Strong security focus",
          "Sustainable staking model",
          "Formal verification",
          "Academic rigor"
        ],
        weaknesses: [
          "Slow development pace",
          "Limited smart contract language",
          "Not quantum-resistant",
          "Lower TPS",
          "Complex development process"
        ]
      },
      {
        name: "Avalanche",
        logo: "🏔️",
        category: "High Speed L1",
        marketCap: 15000000000,
        tps: 4500,
        latency: 2,
        securityScore: 88,
        scalability: 92,
        developerExperience: 85,
        ecosystemSize: 1000000,
        quantumResistance: false,
        dagArchitecture: false,
        features: {
          smartContracts: true,
          defi: true,
          nft: true,
          crossChain: true,
          privacy: false,
          governance: true,
          staking: true,
          layer2: true,
          zkProofs: true,
          enterprise: true,
          mobileSdk: true,
          aiOptimization: false,
          quantumResistant: false,
          dagConsensus: false,
          interoperability: true
        },
        strengths: [
          "High TPS and low latency",
          "Subnet architecture",
          "EVM compatibility",
          "Strong DeFi ecosystem",
          "Energy efficient"
        ],
        weaknesses: [
          "Not quantum-resistant",
          "Limited privacy features",
          "Centralization concerns",
          "Complex subnet setup",
          "Higher validator costs"
        ]
      },
      {
        name: "Hedera",
        logo: "🌿",
        category: "Enterprise DLT",
        marketCap: 2500000000,
        tps: 10000,
        latency: 3,
        securityScore: 96,
        scalability: 94,
        developerExperience: 80,
        ecosystemSize: 500000,
        quantumResistance: false,
        dagArchitecture: true,
        features: {
          smartContracts: true,
          defi: true,
          nft: true,
          crossChain: true,
          privacy: true,
          governance: true,
          staking: true,
          layer2: true,
          zkProofs: true,
          enterprise: true,
          mobileSdk: true,
          aiOptimization: false,
          quantumResistant: false,
          dagConsensus: true,
          interoperability: true
        },
        strengths: [
          "Hashgraph consensus",
          "Enterprise focus",
          "High performance",
          "Low fees",
          "Governed by council"
        ],
        weaknesses: [
          "Not quantum-resistant",
          "Centralized governance",
          "Limited developer tools",
          "Smaller ecosystem",
          "Council control concerns"
        ]
      },
      {
        name: "Quantum Resistant Ledger (QRL)",
        logo: "🔐",
        category: "Quantum-Secure Blockchain",
        marketCap: 50000000,
        tps: 75,
        latency: 60,
        securityScore: 99,
        scalability: 60,
        developerExperience: 65,
        ecosystemSize: 50000,
        quantumResistance: true,
        dagArchitecture: false,
        features: {
          smartContracts: false,
          defi: false,
          nft: false,
          crossChain: false,
          privacy: true,
          governance: false,
          staking: true,
          layer2: false,
          zkProofs: false,
          enterprise: false,
          mobileSdk: false,
          aiOptimization: false,
          quantumResistant: true,
          dagConsensus: false,
          interoperability: false
        },
        strengths: [
          "Quantum-resistant",
          "Post-quantum cryptography",
          "Security focus",
          "Innovative technology",
          "Research-driven"
        ],
        weaknesses: [
          "Very low TPS",
          "Limited functionality",
          "Small ecosystem",
          "No smart contracts",
          "High latency"
        ]
      }
    ];

    return NextResponse.json({
      success: true,
      data: blockchains,
      timestamp: new Date().toISOString(),
      total: blockchains.length
    });

  } catch (error) {
    console.error('Error fetching blockchain competitive data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blockchain competitive data' },
      { status: 500 }
    );
  }
}
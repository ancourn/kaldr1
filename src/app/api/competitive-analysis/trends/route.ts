import { NextRequest, NextResponse } from 'next/server';

interface MarketTrend {
  name: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  adoptionRate: number;
  kaldrixReadiness: number;
  category: string;
  keyDrivers: string[];
  marketSize: number;
}

export async function GET(request: NextRequest) {
  try {
    const marketTrends: MarketTrend[] = [
      {
        name: "Quantum Computing Threat",
        description: "Quantum computers threaten current cryptographic systems",
        impact: "high",
        timeframe: "3-5 years",
        adoptionRate: 85,
        kaldrixReadiness: 95,
        category: "Security",
        keyDrivers: [
          "Quantum computing advancement",
          "Cryptographic vulnerability",
          "Enterprise security concerns",
          "Regulatory requirements"
        ],
        marketSize: 150000000000
      },
      {
        name: "AI-Optimized Blockchains",
        description: "AI integration for network optimization and smart contracts",
        impact: "high",
        timeframe: "1-2 years",
        adoptionRate: 70,
        kaldrixReadiness: 80,
        category: "Technology",
        keyDrivers: [
          "Machine learning advancement",
          "Network efficiency demands",
          "Predictive analytics",
          "Automated governance"
        ],
        marketSize: 80000000000
      },
      {
        name: "Zero-Knowledge Proofs",
        description: "Privacy-preserving transactions and computations",
        impact: "high",
        timeframe: "1-3 years",
        adoptionRate: 90,
        kaldrixReadiness: 85,
        category: "Privacy",
        keyDrivers: [
          "Privacy regulations",
          "Enterprise confidentiality",
          "DeFi privacy needs",
          "Identity protection"
        ],
        marketSize: 120000000000
      },
      {
        name: "Cross-Chain Interoperability",
        description: "Seamless asset and data transfer between blockchains",
        impact: "high",
        timeframe: "1-2 years",
        adoptionRate: 95,
        kaldrixReadiness: 90,
        category: "Infrastructure",
        keyDrivers: [
          "Multi-chain ecosystem growth",
          "Liquidity fragmentation",
          "User experience demands",
          "Enterprise integration"
        ],
        marketSize: 200000000000
      },
      {
        name: "Enterprise Blockchain Adoption",
        description: "Large-scale enterprise blockchain implementations",
        impact: "medium",
        timeframe: "2-4 years",
        adoptionRate: 65,
        kaldrixReadiness: 88,
        category: "Enterprise",
        keyDrivers: [
          "Digital transformation",
          "Supply chain optimization",
          "Financial efficiency",
          "Regulatory compliance"
        ],
        marketSize: 300000000000
      },
      {
        name: "Regulatory Compliance",
        description: "KYC/AML integration and regulatory frameworks",
        impact: "high",
        timeframe: "1-3 years",
        adoptionRate: 80,
        kaldrixReadiness: 75,
        category: "Regulation",
        keyDrivers: [
          "Global regulations",
          "Institutional adoption",
          "Consumer protection",
          "Anti-money laundering"
        ],
        marketSize: 100000000000
      },
      {
        name: "Sustainable Blockchain",
        description: "Energy-efficient and environmentally friendly consensus",
        impact: "medium",
        timeframe: "2-3 years",
        adoptionRate: 75,
        kaldrixReadiness: 85,
        category: "Sustainability",
        keyDrivers: [
          "Environmental concerns",
          "ESG requirements",
          "Energy costs",
          "Corporate responsibility"
        ],
        marketSize: 50000000000
      },
      {
        name: "Decentralized Identity",
        description: "Self-sovereign identity solutions",
        impact: "medium",
        timeframe: "2-4 years",
        adoptionRate: 60,
        kaldrixReadiness: 70,
        category: "Identity",
        keyDrivers: [
          "Privacy concerns",
          "Data ownership",
          "Digital identity needs",
          "Regulatory requirements"
        ],
        marketSize: 80000000000
      }
    ];

    return NextResponse.json({
      success: true,
      data: marketTrends,
      timestamp: new Date().toISOString(),
      total: marketTrends.length,
      summary: {
        highImpact: marketTrends.filter(t => t.impact === 'high').length,
        mediumImpact: marketTrends.filter(t => t.impact === 'medium').length,
        lowImpact: marketTrends.filter(t => t.impact === 'low').length,
        avgKaldrixReadiness: Math.round(marketTrends.reduce((sum, t) => sum + t.kaldrixReadiness, 0) / marketTrends.length),
        totalMarketSize: marketTrends.reduce((sum, t) => sum + t.marketSize, 0)
      }
    });

  } catch (error) {
    console.error('Error fetching market trends data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch market trends data' },
      { status: 500 }
    );
  }
}
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Zap, 
  Shield, 
  Users,
  Globe,
  DollarSign,
  Cpu,
  Layers,
  Database,
  Network,
  Award,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  Lightbulb,
  Rocket,
  Eye,
  Clock
} from "lucide-react";

interface BlockchainFeature {
  name: string;
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
}

interface CompetitiveData {
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

interface MarketTrend {
  name: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  adoptionRate: number;
  kaldrixReadiness: number;
}

interface StrategicOpportunity {
  name: string;
  description: string;
  marketSize: number;
  competitionLevel: 'low' | 'medium' | 'high';
  timeframe: string;
  investmentRequired: number;
  potentialROI: number;
  kaldrixAdvantage: string[];
}

export default function CompetitiveAnalysisPage() {
  const [competitiveData, setCompetitiveData] = useState<CompetitiveData[]>([]);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [strategicOpportunities, setStrategicOpportunities] = useState<StrategicOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Competitive Data
      setCompetitiveData([
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
      ]);

      // Market Trends
      setMarketTrends([
        {
          name: "Quantum Computing Threat",
          description: "Quantum computers threaten current cryptographic systems",
          impact: "high",
          timeframe: "3-5 years",
          adoptionRate: 85,
          kaldrixReadiness: 95
        },
        {
          name: "AI-Optimized Blockchains",
          description: "AI integration for network optimization and smart contracts",
          impact: "high",
          timeframe: "1-2 years",
          adoptionRate: 70,
          kaldrixReadiness: 80
        },
        {
          name: "Zero-Knowledge Proofs",
          description: "Privacy-preserving transactions and computations",
          impact: "high",
          timeframe: "1-3 years",
          adoptionRate: 90,
          kaldrixReadiness: 85
        },
        {
          name: "Cross-Chain Interoperability",
          description: "Seamless asset and data transfer between blockchains",
          impact: "high",
          timeframe: "1-2 years",
          adoptionRate: 95,
          kaldrixReadiness: 90
        },
        {
          name: "Enterprise Blockchain Adoption",
          description: "Large-scale enterprise blockchain implementations",
          impact: "medium",
          timeframe: "2-4 years",
          adoptionRate: 65,
          kaldrixReadiness: 88
        },
        {
          name: "Regulatory Compliance",
          description: "KYC/AML integration and regulatory frameworks",
          impact: "high",
          timeframe: "1-3 years",
          adoptionRate: 80,
          kaldrixReadiness: 75
        },
        {
          name: "Sustainable Blockchain",
          description: "Energy-efficient and environmentally friendly consensus",
          impact: "medium",
          timeframe: "2-3 years",
          adoptionRate: 75,
          kaldrixReadiness: 85
        },
        {
          name: "Decentralized Identity",
          description: "Self-sovereign identity solutions",
          impact: "medium",
          timeframe: "2-4 years",
          adoptionRate: 60,
          kaldrixReadiness: 70
        }
      ]);

      // Strategic Opportunities
      setStrategicOpportunities([
        {
          name: "Quantum-Resistant DeFi",
          description: "DeFi protocols with quantum-resistant security",
          marketSize: 50000000000,
          competitionLevel: "low",
          timeframe: "6-12 months",
          investmentRequired: 5000000,
          potentialROI: 250,
          kaldrixAdvantage: [
            "First-mover advantage in quantum-resistant DeFi",
            "Existing DAG architecture for high performance",
            "Built-in privacy features",
            "Cross-chain compatibility"
          ]
        },
        {
          name: "Enterprise Security Solutions",
          description: "Quantum-resistant security for enterprise applications",
          marketSize: 80000000000,
          competitionLevel: "medium",
          timeframe: "12-18 months",
          investmentRequired: 10000000,
          potentialROI: 180,
          kaldrixAdvantage: [
            "Enterprise-grade security architecture",
            "Compliance-ready framework",
            "Scalable infrastructure",
            "Professional support and SLAs"
          ]
        },
        {
          name: "AI-Optimized Consensus",
          description: "AI-driven network optimization and resource allocation",
          marketSize: 30000000000,
          competitionLevel: "low",
          timeframe: "9-15 months",
          investmentRequired: 8000000,
          potentialROI: 300,
          kaldrixAdvantage: [
            "Existing AI optimization framework",
            "High-performance DAG base",
            "Real-time analytics capabilities",
            "Machine learning integration"
          ]
        },
        {
          name: "Cross-Chain Privacy Hub",
          description: "Privacy-preserving cross-chain transactions",
          marketSize: 40000000000,
          competitionLevel: "medium",
          timeframe: "12-24 months",
          investmentRequired: 12000000,
          potentialROI: 200,
          kaldrixAdvantage: [
            "Advanced privacy features",
            "Cross-chain bridge architecture",
            "Zero-knowledge proof integration",
            "Regulatory compliance"
          ]
        },
        {
          name: "Quantum-Safe NFT Platform",
          description: "NFT platform with quantum-resistant metadata and ownership",
          marketSize: 25000000000,
          competitionLevel: "low",
          timeframe: "6-12 months",
          investmentRequired: 3000000,
          potentialROI: 400,
          kaldrixAdvantage: [
            "Quantum-resistant smart contracts",
            "High-performance NFT minting",
            "Cross-chain NFT transfers",
            "Enterprise NFT solutions"
          ]
        }
      ]);

      setLoading(false);
    };

    fetchData();
  }, []);

  const formatCurrency = (num: number) => {
    if (num >= 1000000000) return "$" + (num / 1000000000).toFixed(1) + "B";
    if (num >= 1000000) return "$" + (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return "$" + (num / 1000).toFixed(1) + "K";
    return "$" + num.toString();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative container mx-auto px-6 py-24">
          <div className="text-center space-y-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <BarChart3 className="h-16 w-16 text-white" />
              <h1 className="text-6xl font-bold">
                Competitive Analysis
              </h1>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              KALDRIX vs Leading Blockchain Platforms
            </h2>
            <p className="text-xl max-w-4xl mx-auto mb-8 text-blue-100">
              Comprehensive feature comparison, performance benchmarking, and strategic positioning analysis
              to identify competitive advantages and market opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50">
                <Target className="mr-2 h-5 w-5" />
                View Strategy
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                <TrendingUp className="mr-2 h-5 w-5" />
                Market Analysis
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </section>

      <div className="container mx-auto px-6 py-12">
        <Tabs defaultValue="feature-comparison" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="feature-comparison" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="market-positioning" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Positioning
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Opportunities
            </TabsTrigger>
          </TabsList>

          {/* Feature Comparison Tab */}
          <TabsContent value="feature-comparison" className="space-y-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4">Feature-by-Feature Comparison</h3>
              <p className="text-lg text-muted-foreground">
                Comprehensive comparison of core features across leading blockchain platforms
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security & Architecture
                  </CardTitle>
                  <CardDescription>
                    Core security features and architectural differences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-2">Quantum Resistance</div>
                        <div className="space-y-2">
                          {competitiveData.map((chain) => (
                            <div key={chain.name} className="flex items-center justify-between">
                              <span className="text-sm">{chain.name}</span>
                              {chain.quantumResistance ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-2">DAG Architecture</div>
                        <div className="space-y-2">
                          {competitiveData.map((chain) => (
                            <div key={chain.name} className="flex items-center justify-between">
                              <span className="text-sm">{chain.name}</span>
                              {chain.dagArchitecture ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    Advanced Features
                  </CardTitle>
                  <CardDescription>
                    Cutting-edge features and capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-2">AI Optimization</div>
                        <div className="space-y-2">
                          {competitiveData.map((chain) => (
                            <div key={chain.name} className="flex items-center justify-between">
                              <span className="text-sm">{chain.name}</span>
                              {chain.features.aiOptimization ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-2">Zero-Knowledge Proofs</div>
                        <div className="space-y-2">
                          {competitiveData.map((chain) => (
                            <div key={chain.name} className="flex items-center justify-between">
                              <span className="text-sm">{chain.name}</span>
                              {chain.features.zkProofs ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Core Feature Matrix
                </CardTitle>
                <CardDescription>
                  Complete feature comparison across all platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Feature</th>
                        {competitiveData.map((chain) => (
                          <th key={chain.name} className="text-center p-2">
                            <div className="flex flex-col items-center">
                              <span className="text-lg">{chain.logo}</span>
                              <span className="text-sm">{chain.name}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(competitiveData[0].features).map((feature) => (
                        <tr key={feature} className="border-b">
                          <td className="p-2 font-medium">
                            {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </td>
                          {competitiveData.map((chain) => (
                            <td key={chain.name} className="text-center p-2">
                              {chain.features[feature] ? (
                                <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600 mx-auto" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4">Performance Benchmarking</h3>
              <p className="text-lg text-muted-foreground">
                Technical performance metrics and scalability comparison
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {competitiveData.map((chain) => (
                <Card key={chain.name} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="text-3xl mb-2">{chain.logo}</div>
                    <CardTitle className="text-lg">{chain.name}</CardTitle>
                    <CardDescription>{chain.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground">TPS</div>
                        <div className="text-2xl font-bold">{formatNumber(chain.tps)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Latency</div>
                        <div className="text-2xl font-bold">{chain.latency}s</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Security Score</div>
                        <div className={`text-2xl font-bold ${getScoreColor(chain.securityScore)}`}>
                          {chain.securityScore}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Scalability</div>
                        <div className={`text-2xl font-bold ${getScoreColor(chain.scalability)}`}>
                          {chain.scalability}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Comparison
                  </CardTitle>
                  <CardDescription>
                    Key performance indicators comparison
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Transactions Per Second</span>
                        <span className="text-sm text-muted-foreground">Higher is better</span>
                      </div>
                      <div className="space-y-2">
                        {competitiveData.map((chain) => (
                          <div key={chain.name} className="flex items-center gap-3">
                            <span className="text-sm w-20">{chain.name}</span>
                            <Progress value={Math.min(100, (chain.tps / 65000) * 100)} className="flex-1" />
                            <span className="text-sm font-medium">{formatNumber(chain.tps)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Latency</span>
                        <span className="text-sm text-muted-foreground">Lower is better</span>
                      </div>
                      <div className="space-y-2">
                        {competitiveData.map((chain) => (
                          <div key={chain.name} className="flex items-center gap-3">
                            <span className="text-sm w-20">{chain.name}</span>
                            <Progress value={Math.max(0, 100 - (chain.latency / 60) * 100)} className="flex-1" />
                            <span className="text-sm font-medium">{chain.latency}s</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Ecosystem & Developer Experience
                  </CardTitle>
                  <CardDescription>
                    Developer ecosystem and ease of development
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Developer Experience</span>
                        <span className="text-sm text-muted-foreground">Higher is better</span>
                      </div>
                      <div className="space-y-2">
                        {competitiveData.map((chain) => (
                          <div key={chain.name} className="flex items-center gap-3">
                            <span className="text-sm w-20">{chain.name}</span>
                            <Progress value={chain.developerExperience} className="flex-1" />
                            <span className={`text-sm font-medium ${getScoreColor(chain.developerExperience)}`}>
                              {chain.developerExperience}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Ecosystem Size</span>
                        <span className="text-sm text-muted-foreground">Larger is better</span>
                      </div>
                      <div className="space-y-2">
                        {competitiveData.map((chain) => (
                          <div key={chain.name} className="flex items-center gap-3">
                            <span className="text-sm w-20">{chain.name}</span>
                            <Progress value={Math.min(100, (chain.ecosystemSize / 5000000) * 100)} className="flex-1" />
                            <span className="text-sm font-medium">{formatNumber(chain.ecosystemSize)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Market Positioning Tab */}
          <TabsContent value="market-positioning" className="space-y-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4">Market Positioning Analysis</h3>
              <p className="text-lg text-muted-foreground">
                Market cap, competitive advantages, and strategic positioning
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Market Capitalization
                  </CardTitle>
                  <CardDescription>
                    Current market valuation comparison
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {competitiveData
                      .sort((a, b) => b.marketCap - a.marketCap)
                      .map((chain, index) => (
                        <div key={chain.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{chain.logo}</div>
                            <div>
                              <div className="font-medium">{chain.name}</div>
                              <div className="text-sm text-muted-foreground">{chain.category}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatCurrency(chain.marketCap)}</div>
                            <div className="text-sm text-muted-foreground">Rank #{index + 1}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    KALDRIX Competitive Advantages
                  </CardTitle>
                  <CardDescription>
                    Unique strengths and differentiators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                        Quantum Resistance Leadership
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Only platform combining quantum-resistant cryptography with high-performance DAG architecture,
                        positioning us as the leader in future-proof blockchain technology.
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        Performance-First Design
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        2,847 TPS with 2.1s latency outperforms most established chains while maintaining
                        enterprise-grade security and scalability.
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                        AI-Optimized Infrastructure
                      </h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Built-in AI optimization for network performance, resource allocation, and
                        predictive analytics - unique among current blockchain platforms.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Competitive Challenges
                  </CardTitle>
                  <CardDescription>
                    Areas requiring improvement and strategic focus
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                        Ecosystem Development
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        284K ecosystem members vs 5M+ for Ethereum - need aggressive developer acquisition
                        and partnership programs.
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                        Market Awareness
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        $850M market cap vs $280B for Ethereum - need increased marketing, exchange listings,
                        and institutional partnerships.
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                        Technology Adoption
                      </h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Complex quantum-resistant technology requires education and simplified developer tools
                        for broader adoption.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Strategic Positioning
                  </CardTitle>
                  <CardDescription>
                    Market positioning and competitive strategy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2">
                        Premium Security Provider
                      </h4>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300">
                        Position as the premium choice for security-conscious applications,
                        enterprise solutions, and future-proof infrastructure.
                      </p>
                    </div>
                    <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                      <h4 className="font-semibold text-teal-800 dark:text-teal-200 mb-2">
                        Performance Leader
                      </h4>
                      <p className="text-sm text-teal-700 dark:text-teal-300">
                        Compete with Solana and Avalanche on performance while offering superior
                        security and quantum resistance.
                      </p>
                    </div>
                    <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                      <h4 className="font-semibold text-cyan-800 dark:text-cyan-200 mb-2">
                        Innovation Pioneer
                      </h4>
                      <p className="text-sm text-cyan-700 dark:text-cyan-300">
                        Lead in emerging technologies like AI optimization, advanced privacy,
                        and cross-chain interoperability.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Market Trends Tab */}
          <TabsContent value="trends" className="space-y-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4">Emerging Market Trends</h3>
              <p className="text-lg text-muted-foreground">
                Key trends shaping the blockchain industry and KALDRIX readiness
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {marketTrends.map((trend, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{trend.name}</CardTitle>
                      <Badge className={getImpactColor(trend.impact)}>
                        {trend.impact} impact
                      </Badge>
                    </div>
                    <CardDescription>{trend.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Market Adoption</span>
                          <span className="text-sm text-muted-foreground">{trend.adoptionRate}%</span>
                        </div>
                        <Progress value={trend.adoptionRate} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">KALDRIX Readiness</span>
                          <span className="text-sm text-muted-foreground">{trend.kaldrixReadiness}%</span>
                        </div>
                        <Progress value={trend.kaldrixReadiness} className="h-2" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Timeframe:</span>
                        <span className="font-medium">{trend.timeframe}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Trend Analysis Summary
                </CardTitle>
                <CardDescription>
                  Key insights and strategic implications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                      Strong Position in Quantum Resistance
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      KALDRIX is exceptionally well-positioned for the quantum computing threat with 95% readiness,
                      compared to industry average of 15% for other major platforms.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      AI Integration Leadership
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      With 80% readiness in AI-optimized blockchains, KALDRIX leads the industry in this emerging trend,
                      providing significant competitive advantage.
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                      Regulatory Compliance Opportunity
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      75% readiness in regulatory compliance presents an opportunity to develop enterprise-grade
                      compliance solutions ahead of market demand.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Strategic Opportunities Tab */}
          <TabsContent value="opportunities" className="space-y-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4">Strategic Opportunities</h3>
              <p className="text-lg text-muted-foreground">
                High-value opportunities and 12-month strategic roadmap
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {strategicOpportunities.map((opportunity, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{opportunity.name}</CardTitle>
                      <Badge className={getCompetitionColor(opportunity.competitionLevel)}>
                        {opportunity.competitionLevel} competition
                      </Badge>
                    </div>
                    <CardDescription>{opportunity.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Market Size</div>
                          <div className="text-lg font-bold">{formatCurrency(opportunity.marketSize)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Potential ROI</div>
                          <div className="text-lg font-bold text-green-600">{opportunity.potentialROI}%</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">KALDRIX Advantages</div>
                        <div className="space-y-1">
                          {opportunity.kaldrixAdvantage.map((advantage, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              {advantage}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Timeframe:</span>
                        <span className="font-medium">{opportunity.timeframe}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Investment:</span>
                        <span className="font-medium">{formatCurrency(opportunity.investmentRequired)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  12-Month Strategic Roadmap
                </CardTitle>
                <CardDescription>
                  Prioritized initiatives for competitive advantage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                      Phase 1 (0-3 months): Quantum-Resistant DeFi Launch
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                      Launch the first quantum-resistant DeFi platform to establish market leadership
                      and demonstrate technical superiority.
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium">Investment: $3M</span>
                      <span className="font-medium">Expected ROI: 200%</span>
                      <span className="font-medium">Market Impact: High</span>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      Phase 2 (3-6 months): AI Optimization Enhancement
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                      Enhance AI-driven network optimization and launch predictive analytics platform
                      for enterprise clients.
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium">Investment: $5M</span>
                      <span className="font-medium">Expected ROI: 180%</span>
                      <span className="font-medium">Market Impact: High</span>
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                      Phase 3 (6-9 months): Enterprise Security Suite
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                      Develop comprehensive enterprise security solutions with quantum-resistant
                      features and regulatory compliance.
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium">Investment: $8M</span>
                      <span className="font-medium">Expected ROI: 150%</span>
                      <span className="font-medium">Market Impact: Medium</span>
                    </div>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                      Phase 4 (9-12 months): Cross-Chain Privacy Hub
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">
                      Launch privacy-preserving cross-chain transaction hub with zero-knowledge proofs
                      and regulatory compliance.
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium">Investment: $12M</span>
                      <span className="font-medium">Expected ROI: 220%</span>
                      <span className="font-medium">Market Impact: High</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
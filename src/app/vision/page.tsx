"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, 
  TrendingUp, 
  Users, 
  Building, 
  Award, 
  Target,
  Rocket,
  Brain,
  Shield,
  BarChart3,
  MapPin,
  Star,
  Zap,
  Layers,
  Network,
  Lightbulb,
  Eye,
  Heart,
  Handshake,
  DollarSign,
  Activity,
  Clock,
  CheckCircle
} from "lucide-react";

interface GlobalMetrics {
  total_countries: number;
  enterprise_adoptions: number;
  developer_community: number;
  ecosystem_projects: number;
  market_cap: number;
  daily_transactions: number;
  network_nodes: number;
  governance_participants: number;
}

interface RegionalData {
  region: string;
  countries: number;
  enterprises: number;
  developers: number;
  projects: number;
  adoption_rate: number;
  growth_trend: 'rising' | 'stable' | 'declining';
}

interface TechnologyLeadership {
  research_papers: number;
  patents_filed: number;
  standards_contributions: number;
  innovation_score: number;
  industry_recognition: number;
  partnerships: number;
}

interface EcosystemMaturity {
  sustainability_score: number;
  governance_health: number;
  economic_vitality: number;
  community_engagement: number;
  innovation_rate: number;
  self_sufficiency: number;
}

interface ResearchArea {
  name: string;
  progress: number;
  status: 'research' | 'development' | 'testing' | 'production';
  impact: 'high' | 'medium' | 'low';
  timeline: string;
  description: string;
}

export default function VisionPage() {
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics>({
    total_countries: 0,
    enterprise_adoptions: 0,
    developer_community: 0,
    ecosystem_projects: 0,
    market_cap: 0,
    daily_transactions: 0,
    network_nodes: 0,
    governance_participants: 0
  });

  const [regionalData, setRegionalData] = useState<RegionalData[]>([]);
  const [techLeadership, setTechLeadership] = useState<TechnologyLeadership>({
    research_papers: 0,
    patents_filed: 0,
    standards_contributions: 0,
    innovation_score: 0,
    industry_recognition: 0,
    partnerships: 0
  });

  const [ecosystemMaturity, setEcosystemMaturity] = useState<EcosystemMaturity>({
    sustainability_score: 0,
    governance_health: 0,
    economic_vitality: 0,
    community_engagement: 0,
    innovation_rate: 0,
    self_sufficiency: 0
  });

  const [researchAreas, setResearchAreas] = useState<ResearchArea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API calls with mock data
    const fetchVisionData = async () => {
      // Global Metrics
      setGlobalMetrics({
        total_countries: 147,
        enterprise_adoptions: 2847,
        developer_community: 125000,
        ecosystem_projects: 3420,
        market_cap: 8750000000,
        daily_transactions: 2847000,
        network_nodes: 15420,
        governance_participants: 8750
      });

      // Regional Data
      setRegionalData([
        {
          region: "North America",
          countries: 3,
          enterprises: 892,
          developers: 42500,
          projects: 1240,
          adoption_rate: 87,
          growth_trend: 'rising'
        },
        {
          region: "Europe",
          countries: 28,
          enterprises: 756,
          developers: 38200,
          projects: 980,
          adoption_rate: 82,
          growth_trend: 'rising'
        },
        {
          region: "Asia Pacific",
          countries: 24,
          enterprises: 634,
          developers: 28900,
          projects: 756,
          adoption_rate: 78,
          growth_trend: 'rising'
        },
        {
          region: "Latin America",
          countries: 20,
          enterprises: 287,
          developers: 8900,
          projects: 234,
          adoption_rate: 65,
          growth_trend: 'rising'
        },
        {
          region: "Middle East & Africa",
          countries: 72,
          enterprises: 278,
          developers: 6500,
          projects: 210,
          adoption_rate: 58,
          growth_trend: 'stable'
        }
      ]);

      // Technology Leadership
      setTechLeadership({
        research_papers: 156,
        patents_filed: 89,
        standards_contributions: 34,
        innovation_score: 94,
        industry_recognition: 87,
        partnerships: 156
      });

      // Ecosystem Maturity
      setEcosystemMaturity({
        sustainability_score: 92,
        governance_health: 88,
        economic_vitality: 85,
        community_engagement: 90,
        innovation_rate: 87,
        self_sufficiency: 84
      });

      // Research Areas
      setResearchAreas([
        {
          name: "Next-Generation Post-Quantum Algorithms",
          progress: 78,
          status: 'development',
          impact: 'high',
          timeline: "Q2 2026",
          description: "Developing advanced PQC algorithms resistant to quantum computing attacks"
        },
        {
          name: "Quantum-Resistant Zero-Knowledge Proofs",
          progress: 65,
          status: 'research',
          impact: 'high',
          timeline: "Q4 2026",
          description: "Creating privacy-preserving proofs with quantum resistance"
        },
        {
          name: "Advanced Multi-Party Computation",
          progress: 82,
          status: 'testing',
          impact: 'medium',
          timeline: "Q1 2026",
          description: "Enhancing secure computation protocols for enterprise use"
        },
        {
          name: "Homomorphic Encryption Integration",
          progress: 45,
          status: 'research',
          impact: 'high',
          timeline: "Q3 2026",
          description: "Enabling computation on encrypted data with quantum resistance"
        },
        {
          name: "Cross-Chain Quantum Resistance",
          progress: 71,
          status: 'development',
          impact: 'medium',
          timeline: "Q2 2026",
          description: "Extending quantum resistance to multi-chain ecosystems"
        }
      ]);

      setLoading(false);
    };

    fetchVisionData();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + "B";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    return "$" + formatNumber(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'production': return 'bg-green-500';
      case 'testing': return 'bg-blue-500';
      case 'development': return 'bg-yellow-500';
      case 'research': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'stable': return <BarChart3 className="h-4 w-4 text-blue-600" />;
      case 'declining': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-600" />;
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
              <Eye className="h-16 w-16 text-white" />
              <h1 className="text-6xl font-bold">
                Long-term Vision
              </h1>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Global Adoption & Technological Leadership
            </h2>
            <p className="text-xl max-w-4xl mx-auto mb-8 text-blue-100">
              Building the future of quantum-resistant blockchain technology through global adoption, 
              technological innovation, and ecosystem maturity. Our vision extends beyond 2026, 
              establishing KALDRIX as the industry leader in post-quantum blockchain solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50">
                <Rocket className="mr-2 h-5 w-5" />
                Join the Vision
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                <Target className="mr-2 h-5 w-5" />
                View Roadmap
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </section>

      <div className="container mx-auto px-6 py-12">
        <Tabs defaultValue="global-adoption" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="global-adoption" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Global Adoption
            </TabsTrigger>
            <TabsTrigger value="tech-leadership" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Tech Leadership
            </TabsTrigger>
            <TabsTrigger value="ecosystem-maturity" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Ecosystem Maturity
            </TabsTrigger>
            <TabsTrigger value="future-research" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Future Research
            </TabsTrigger>
          </TabsList>

          {/* Global Adoption Tab */}
          <TabsContent value="global-adoption" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Countries Reached</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{globalMetrics.total_countries}</div>
                  <p className="text-xs text-muted-foreground">Global presence</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enterprise Adoptions</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(globalMetrics.enterprise_adoptions)}</div>
                  <p className="text-xs text-muted-foreground">Business integrations</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Developer Community</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(globalMetrics.developer_community)}</div>
                  <p className="text-xs text-muted-foreground">Active developers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(globalMetrics.market_cap)}</div>
                  <p className="text-xs text-muted-foreground">Total market value</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Regional Adoption Metrics
                </CardTitle>
                <CardDescription>
                  Global expansion and adoption rates across different regions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {regionalData.map((region, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{region.region}</span>
                          {getTrendIcon(region.growth_trend)}
                          <Badge variant="outline">{region.countries} countries</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">{region.adoption_rate}% adoption</span>
                      </div>
                      <Progress value={region.adoption_rate} className="h-2" />
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Enterprises:</span>
                          <span className="ml-1 font-medium">{region.enterprises}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Developers:</span>
                          <span className="ml-1 font-medium">{formatNumber(region.developers)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Projects:</span>
                          <span className="ml-1 font-medium">{region.projects}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tech Leadership Tab */}
          <TabsContent value="tech-leadership" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Research Papers</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{techLeadership.research_papers}</div>
                  <p className="text-xs text-muted-foreground">Academic publications</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Patents Filed</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{techLeadership.patents_filed}</div>
                  <p className="text-xs text-muted-foreground">Intellectual property</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Innovation Score</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{techLeadership.innovation_score}%</div>
                  <p className="text-xs text-muted-foreground">Industry innovation index</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Industry Recognition
                  </CardTitle>
                  <CardDescription>
                    Awards, certifications, and industry acknowledgments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Innovation Awards</span>
                      <span className="font-medium">{techLeadership.industry_recognition}%</span>
                    </div>
                    <Progress value={techLeadership.industry_recognition} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Standards Contributions</span>
                      <span className="font-medium">{techLeadership.standards_contributions}</span>
                    </div>
                    <Progress value={(techLeadership.standards_contributions / 50) * 100} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Strategic Partnerships</span>
                      <span className="font-medium">{techLeadership.partnerships}</span>
                    </div>
                    <Progress value={(techLeadership.partnerships / 200) * 100} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Leadership Metrics
                  </CardTitle>
                  <CardDescription>
                    Key performance indicators for technological leadership
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Market Leader</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Achieved</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Technology Pioneer</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Achieved</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Industry Standard</span>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">In Progress</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ecosystem Maturity Tab */}
          <TabsContent value="ecosystem-maturity" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sustainability Score</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ecosystemMaturity.sustainability_score}%</div>
                  <p className="text-xs text-muted-foreground">Long-term viability</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Governance Health</CardTitle>
                  <Handshake className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ecosystemMaturity.governance_health}%</div>
                  <p className="text-xs text-muted-foreground">Decentralized governance</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Economic Vitality</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ecosystemMaturity.economic_vitality}%</div>
                  <p className="text-xs text-muted-foreground">Economic activity</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Ecosystem Health Overview
                </CardTitle>
                <CardDescription>
                  Comprehensive metrics for ecosystem maturity and sustainability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Sustainability</span>
                      <span className="text-sm text-muted-foreground">{ecosystemMaturity.sustainability_score}%</span>
                    </div>
                    <Progress value={ecosystemMaturity.sustainability_score} className="h-3" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Governance Health</span>
                      <span className="text-sm text-muted-foreground">{ecosystemMaturity.governance_health}%</span>
                    </div>
                    <Progress value={ecosystemMaturity.governance_health} className="h-3" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Economic Vitality</span>
                      <span className="text-sm text-muted-foreground">{ecosystemMaturity.economic_vitality}%</span>
                    </div>
                    <Progress value={ecosystemMaturity.economic_vitality} className="h-3" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Community Engagement</span>
                      <span className="text-sm text-muted-foreground">{ecosystemMaturity.community_engagement}%</span>
                    </div>
                    <Progress value={ecosystemMaturity.community_engagement} className="h-3" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Innovation Rate</span>
                      <span className="text-sm text-muted-foreground">{ecosystemMaturity.innovation_rate}%</span>
                    </div>
                    <Progress value={ecosystemMaturity.innovation_rate} className="h-3" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Self-Sufficiency</span>
                      <span className="text-sm text-muted-foreground">{ecosystemMaturity.self_sufficiency}%</span>
                    </div>
                    <Progress value={ecosystemMaturity.self_sufficiency} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Future Research Tab */}
          <TabsContent value="future-research" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {researchAreas.map((research, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{research.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(research.status)}`}></div>
                        <Badge variant="outline" className={getImpactColor(research.impact)}>
                          {research.impact} impact
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{research.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Progress</span>
                        <span className="text-sm font-medium">{research.progress}%</span>
                      </div>
                      <Progress value={research.progress} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge variant="secondary">{research.status}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Timeline:</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{research.timeline}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Research Priorities
                </CardTitle>
                <CardDescription>
                  Strategic focus areas for future research and development
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">Immediate Priorities (2026)</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Next-generation PQC algorithms
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Advanced multi-party computation
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Cross-chain quantum resistance
                      </li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Long-term Vision (2027+)</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        Quantum-resistant ZK proofs
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        Homomorphic encryption
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        Post-quantum smart contracts
                      </li>
                    </ul>
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
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Users, Building, TrendingUp, Award, BookOpen, Github, ExternalLink, Rocket, DollarSign, MessageSquare, Zap, GraduationCap, BarChart3, Shield } from "lucide-react";

interface DeveloperStats {
  active_developers: number;
  total_projects: number;
  grant_funded: number;
  documentation_pages: number;
  api_calls_today: number;
  sdk_downloads: number;
  community_members: number;
  tutorial_completions: number;
  monthly_growth: {
    developers: number;
    projects: number;
    grants: number;
    community: number;
  };
}

interface GrantProgram {
  id: string;
  title: string;
  description: string;
  funding_amount: number;
  status: "open" | "in_review" | "awarded" | "completed";
  applicants: number;
  deadline: string;
  category: string;
}

interface Partnership {
  id: string;
  name: string;
  industry: string;
  status: "active" | "pending" | "completed" | "terminated";
  integration_level: number;
  projects_count: number;
  partnership_type: "technology" | "enterprise" | "financial" | "community";
  description: string;
}

export default function DeveloperPortal() {
  const [stats, setStats] = useState<DeveloperStats | null>(null);
  const [grants, setGrants] = useState<GrantProgram[]>([]);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch ecosystem stats
        const statsResponse = await fetch('/api/ecosystem/stats');
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }

        // Fetch grants
        const grantsResponse = await fetch('/api/ecosystem/grants');
        const grantsData = await grantsResponse.json();
        if (grantsData.success) {
          setGrants(grantsData.data);
        }

        // Fetch partnerships
        const partnershipsResponse = await fetch('/api/ecosystem/partnerships');
        const partnershipsData = await partnershipsResponse.json();
        if (partnershipsData.success) {
          setPartnerships(partnershipsData.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-500";
      case "in_review": return "bg-yellow-500";
      case "awarded": return "bg-blue-500";
      case "completed": return "bg-purple-500";
      case "active": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open": return "Open";
      case "in_review": return "In Review";
      case "awarded": return "Awarded";
      case "completed": return "Completed";
      case "active": return "Active";
      case "pending": return "Pending";
      case "terminated": return "Terminated";
      default: return status;
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
        <div className="relative container mx-auto px-6 py-16">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Code className="h-12 w-12 text-white" />
              <h1 className="text-4xl font-bold">Developer Portal</h1>
            </div>
            <h2 className="text-2xl font-bold mb-4">Build the Future with KALDRIX</h2>
            <p className="text-lg max-w-3xl mx-auto mb-6 text-blue-100">
              Access comprehensive tools, documentation, and resources to build innovative applications 
              on the world's first quantum-resistant DAG blockchain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50">
                <Rocket className="mr-2 h-5 w-5" />
                Start Building
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                <BookOpen className="mr-2 h-5 w-5" />
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Overview */}
      <section className="container mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Ecosystem Growth Metrics</h2>
          <p className="text-lg text-muted-foreground">Track the growth of our developer ecosystem</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Developers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active_developers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.monthly_growth.developers}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <Code className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_projects}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.monthly_growth.projects}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Grant Funded</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.grant_funded}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.monthly_growth.grants}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Calls Today</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.api_calls_today)}</div>
                <p className="text-xs text-muted-foreground">
                  High network activity
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="grants">Grants</TabsTrigger>
            <TabsTrigger value="partnerships">Partnerships</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Get started with KALDRIX development</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full justify-start" variant="outline">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Read Documentation
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Code className="mr-2 h-4 w-4" />
                      View API Reference
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Github className="mr-2 h-4 w-4" />
                      GitHub Repository
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Join Discord Community
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Community Growth</CardTitle>
                    <CardDescription>Developer community metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Community Members</span>
                        <span className="text-sm font-medium">{formatNumber(stats.community_members)}</span>
                      </div>
                      <Progress value={91} />
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Active Projects</span>
                        <span className="text-sm font-medium">{stats.total_projects}</span>
                      </div>
                      <Progress value={78} />
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Grant Success Rate</span>
                        <span className="text-sm font-medium">78%</span>
                      </div>
                      <Progress value={78} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="grants" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {grants.map((grant) => (
                <Card key={grant.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{grant.title}</CardTitle>
                        <CardDescription>{grant.description}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(grant.status)}>
                        {getStatusText(grant.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Funding</span>
                        <span className="font-medium">${grant.funding_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Category</span>
                        <Badge variant="outline">{grant.category}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Applicants</span>
                        <span className="font-medium">{grant.applicants}</span>
                      </div>
                      <Button className="w-full mt-4">
                        {grant.status === "open" ? "Apply Now" : "View Details"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="partnerships" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {partnerships.map((partner) => (
                <Card key={partner.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{partner.name}</CardTitle>
                        <CardDescription>{partner.industry} Industry</CardDescription>
                      </div>
                      <Badge className={getStatusColor(partner.status)}>
                        {getStatusText(partner.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Integration Level</span>
                        <span className="font-medium">{partner.integration_level}%</span>
                      </div>
                      <Progress value={partner.integration_level} />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Active Projects</span>
                        <span className="font-medium">{partner.projects_count}</span>
                      </div>
                      <Button className="w-full mt-4" variant="outline">
                        View Partnership Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Getting Started</span>
                      <ExternalLink className="h-4 w-4" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">API Reference</span>
                      <ExternalLink className="h-4 w-4" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Smart Contracts</span>
                      <ExternalLink className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    SDKs & Tools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">JavaScript SDK</span>
                      <ExternalLink className="h-4 w-4" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Python SDK</span>
                      <ExternalLink className="h-4 w-4" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Mobile SDK</span>
                      <ExternalLink className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Community
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Discord Server</span>
                      <ExternalLink className="h-4 w-4" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">GitHub Discussions</span>
                      <ExternalLink className="h-4 w-4" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Developer Forum</span>
                      <ExternalLink className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Build on KALDRIX?</h2>
          <p className="text-lg mb-6 text-purple-100">
            Join thousands of developers building the future of blockchain technology
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50">
              <Rocket className="mr-2 h-5 w-5" />
              Start Building Now
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
              <MessageSquare className="mr-2 h-5 w-5" />
              Join Community
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
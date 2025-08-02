"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Scale, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  Plus,
  Vote,
  BarChart3,
  Activity
} from "lucide-react";

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  proposal_type: string;
  status: "draft" | "discussion" | "voting" | "approved" | "rejected" | "executed" | "cancelled" | "expired";
  created_at: string;
  voting_start_time: string;
  voting_end_time: string;
  execution_time: string;
  for_votes: number;
  against_votes: number;
  abstain_votes: number;
  veto_votes: number;
  total_voting_power: number;
  metadata: {
    tags: string[];
    links: Array<{ title: string; url: string; description?: string }>;
  };
}

interface GovernanceStats {
  total_proposals: number;
  active_proposals: number;
  executed_proposals: number;
  rejected_proposals: number;
  average_voting_participation: number;
  proposal_success_rate: number;
  emergency_actions_count: number;
  rollback_count: number;
  total_voting_power: number;
  active_voters: number;
  proposal_types: {
    protocol_upgrade: number;
    parameter_change: number;
    emergency_action: number;
    treasury_management: number;
    custom: number;
  };
  recent_activity: Array<{
    type: "proposal_created" | "vote_cast" | "proposal_executed";
    timestamp: string;
    description: string;
  }>;
}

export default function GovernanceDashboard() {
  const [stats, setStats] = useState<GovernanceStats | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchGovernanceData();
  }, []);

  const fetchGovernanceData = async () => {
    try {
      // Fetch stats
      const statsResponse = await fetch('/api/governance/stats');
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Fetch proposals
      const proposalsResponse = await fetch('/api/governance/proposals?limit=5');
      const proposalsData = await proposalsResponse.json();
      if (proposalsData.success) {
        setProposals(proposalsData.data);
      }
    } catch (error) {
      console.error('Failed to fetch governance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500";
      case "executed": return "bg-blue-500";
      case "voting": return "bg-purple-500";
      case "discussion": return "bg-yellow-500";
      case "rejected": return "bg-red-500";
      case "cancelled": return "bg-gray-500";
      case "expired": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "executed": return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "voting": return <Vote className="h-4 w-4 text-purple-600" />;
      case "discussion": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "rejected": return <XCircle className="h-4 w-4 text-red-600" />;
      case "cancelled": return <XCircle className="h-4 w-4 text-gray-600" />;
      case "expired": return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const calculateVotePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return (votes / total) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Governance Dashboard</h2>
          <p className="text-muted-foreground">Manage proposals, voting, and network governance</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Proposal
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_proposals}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_proposals} active
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.proposal_success_rate * 100).toFixed(1)}%</div>
              <Progress value={stats.proposal_success_rate * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Voters</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_voters}</div>
              <p className="text-xs text-muted-foreground">
                {(stats.average_voting_participation * 100).toFixed(1)}% participation
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Voting Power</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_voting_power.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total network power
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="voting">Voting</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Proposal Types</CardTitle>
                  <CardDescription>Distribution of proposal types</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Protocol Upgrades</span>
                    <Badge variant="secondary">{stats.proposal_types.protocol_upgrade}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Parameter Changes</span>
                    <Badge variant="secondary">{stats.proposal_types.parameter_change}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Emergency Actions</span>
                    <Badge variant="destructive">{stats.proposal_types.emergency_action}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Treasury Management</span>
                    <Badge variant="secondary">{stats.proposal_types.treasury_management}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Custom Proposals</span>
                    <Badge variant="secondary">{stats.proposal_types.custom}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Governance Health</CardTitle>
                  <CardDescription>Key governance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Emergency Actions</span>
                      <span>{stats.emergency_actions_count}</span>
                    </div>
                    {stats.emergency_actions_count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Emergency actions taken
                      </Badge>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Network Rollbacks</span>
                      <span>{stats.rollback_count}</span>
                    </div>
                    {stats.rollback_count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Rollbacks executed
                      </Badge>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Execution Rate</span>
                      <span>{((stats.executed_proposals / stats.total_proposals) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={(stats.executed_proposals / stats.total_proposals) * 100} 
                      className="h-2" 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="proposals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Proposals</CardTitle>
              <CardDescription>Latest governance proposals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <div key={proposal.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{proposal.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {proposal.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{proposal.proposal_type}</Badge>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(proposal.status)}
                            <Badge className={getStatusColor(proposal.status)}>
                              {proposal.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            by {proposal.proposer}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>

                    {proposal.status === "voting" && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="flex justify-between">
                              <span>For</span>
                              <span className="text-green-600">
                                {calculateVotePercentage(proposal.for_votes, proposal.total_voting_power).toFixed(1)}%
                              </span>
                            </div>
                            <Progress 
                              value={calculateVotePercentage(proposal.for_votes, proposal.total_voting_power)} 
                              className="h-2" 
                            />
                          </div>
                          <div>
                            <div className="flex justify-between">
                              <span>Against</span>
                              <span className="text-red-600">
                                {calculateVotePercentage(proposal.against_votes, proposal.total_voting_power).toFixed(1)}%
                              </span>
                            </div>
                            <Progress 
                              value={calculateVotePercentage(proposal.against_votes, proposal.total_voting_power)} 
                              className="h-2" 
                            />
                          </div>
                          <div>
                            <div className="flex justify-between">
                              <span>Abstain</span>
                              <span className="text-gray-600">
                                {calculateVotePercentage(proposal.abstain_votes, proposal.total_voting_power).toFixed(1)}%
                              </span>
                            </div>
                            <Progress 
                              value={calculateVotePercentage(proposal.abstain_votes, proposal.total_voting_power)} 
                              className="h-2" 
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            Voting ends {formatTimestamp(proposal.voting_end_time)}
                          </span>
                          <span>
                            {proposal.total_voting_power.toLocaleString()} total power
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voting Power Distribution</CardTitle>
              <CardDescription>Overview of voting power across the network</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Voting Power</span>
                        <span className="font-semibold">{stats.total_voting_power.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Active Voters</span>
                        <span className="font-semibold">{stats.active_voters}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Avg. Participation</span>
                        <span className="font-semibold">
                          {(stats.average_voting_participation * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Success Rate</span>
                        <span className="font-semibold text-green-600">
                          {(stats.proposal_success_rate * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Emergency Actions</span>
                        <span className="font-semibold text-red-600">
                          {stats.emergency_actions_count}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Rollbacks</span>
                        <span className="font-semibold text-orange-600">
                          {stats.rollback_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest governance activities</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="space-y-3">
                  {stats.recent_activity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(activity.timestamp)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
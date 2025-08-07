"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Vote, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Users,
  TrendingUp,
  MessageSquare
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

interface Vote {
  id: string;
  proposal_id: string;
  voter: string;
  vote_type: "for" | "against" | "abstain" | "veto";
  voting_power: number;
  timestamp: string;
  justification?: string;
}

interface VotingInterfaceProps {
  proposal: Proposal;
  currentUser?: string;
  onVoteCast?: () => void;
}

export default function VotingInterface({ proposal, currentUser = "validator_1", onVoteCast }: VotingInterfaceProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedVote, setSelectedVote] = useState<"for" | "against" | "abstain" | "veto" | null>(null);
  const [justification, setJustification] = useState("");
  const [votes, setVotes] = useState<Vote[]>([]);
  const [userVote, setUserVote] = useState<Vote | null>(null);

  useEffect(() => {
    fetchVotes();
  }, [proposal.id]);

  const fetchVotes = async () => {
    try {
      const response = await fetch(`/api/governance/votes?proposal_id=${proposal.id}`);
      const data = await response.json();
      if (data.success) {
        setVotes(data.data);
        // Check if user has already voted
        const userVote = data.data.find((vote: Vote) => vote.voter === currentUser);
        setUserVote(userVote || null);
      }
    } catch (error) {
      console.error('Failed to fetch votes:', error);
    }
  };

  const handleVote = async () => {
    if (!selectedVote) return;

    setLoading(true);
    try {
      const response = await fetch('/api/governance/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposal_id: proposal.id,
          voter: currentUser,
          vote_type: selectedVote,
          justification: justification || undefined
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setUserVote(result.data);
        setOpen(false);
        onVoteCast?.();
        fetchVotes(); // Refresh votes
      } else {
        console.error('Failed to cast vote:', result.error);
      }
    } catch (error) {
      console.error('Error casting vote:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateVotePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return (votes / total) * 100;
  };

  const canVote = proposal.status === "voting" && !userVote;
  const hasVotingPower = true; // This would be checked against user's actual voting power

  const getVoteColor = (voteType: string) => {
    switch (voteType) {
      case "for": return "text-green-600";
      case "against": return "text-red-600";
      case "abstain": return "text-gray-600";
      case "veto": return "text-orange-600";
      default: return "text-gray-600";
    }
  };

  const getVoteIcon = (voteType: string) => {
    switch (voteType) {
      case "for": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "against": return <XCircle className="h-4 w-4 text-red-600" />;
      case "abstain": return <Clock className="h-4 w-4 text-gray-600" />;
      case "veto": return <AlertTriangle className="h-4 w-4 text-orange-600" />;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Voting Interface</span>
          {userVote && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {getVoteIcon(userVote.vote_type)}
              You voted {userVote.vote_type}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Cast your vote on this proposal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voting Results */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-600">For</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {proposal.for_votes.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {calculateVotePercentage(proposal.for_votes, proposal.total_voting_power).toFixed(1)}%
              </div>
              <Progress 
                value={calculateVotePercentage(proposal.for_votes, proposal.total_voting_power)} 
                className="h-2" 
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-600">Against</span>
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">
                {proposal.against_votes.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {calculateVotePercentage(proposal.against_votes, proposal.total_voting_power).toFixed(1)}%
              </div>
              <Progress 
                value={calculateVotePercentage(proposal.against_votes, proposal.total_voting_power)} 
                className="h-2" 
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Abstain</span>
                <Clock className="h-4 w-4 text-gray-600" />
              </div>
              <div className="text-2xl font-bold text-gray-600">
                {proposal.abstain_votes.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {calculateVotePercentage(proposal.abstain_votes, proposal.total_voting_power).toFixed(1)}%
              </div>
              <Progress 
                value={calculateVotePercentage(proposal.abstain_votes, proposal.total_voting_power)} 
                className="h-2" 
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-600">Veto</span>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {proposal.veto_votes.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {calculateVotePercentage(proposal.veto_votes, proposal.total_voting_power).toFixed(1)}%
              </div>
              <Progress 
                value={calculateVotePercentage(proposal.veto_votes, proposal.total_voting_power)} 
                className="h-2" 
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{votes.length} votes cast</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>{proposal.total_voting_power.toLocaleString()} total power</span>
            </div>
          </div>
        </div>

        {/* Voting Status */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Voting Status</span>
            <Badge variant={proposal.status === "voting" ? "default" : "secondary"}>
              {proposal.status === "voting" ? "Active" : "Closed"}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>
              Started: {formatTimestamp(proposal.voting_start_time)}
            </div>
            <div>
              Ends: {formatTimestamp(proposal.voting_end_time)}
            </div>
            {proposal.status === "voting" && (
              <div className="text-green-600 font-medium">
                Voting is currently open
              </div>
            )}
          </div>
        </div>

        {/* Vote Button */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full" 
              disabled={!canVote || !hasVotingPower}
            >
              <Vote className="mr-2 h-4 w-4" />
              {userVote ? "Change Vote" : "Cast Vote"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cast Your Vote</DialogTitle>
              <DialogDescription>
                Vote on proposal: "{proposal.title}"
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { type: "for", label: "For", color: "bg-green-500", icon: CheckCircle },
                  { type: "against", label: "Against", color: "bg-red-500", icon: XCircle },
                  { type: "abstain", label: "Abstain", color: "bg-gray-500", icon: Clock },
                  { type: "veto", label: "Veto", color: "bg-orange-500", icon: AlertTriangle }
                ].map(({ type, label, color, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedVote(type as any)}
                    className={`p-4 border rounded-lg text-center transition-colors ${
                      selectedVote === type 
                        ? `${color} text-white border-transparent` 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Icon className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">{label}</div>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="justification">Justification (Optional)</Label>
                <Textarea
                  id="justification"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Explain your voting decision..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Voting Information</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Voter: {currentUser}</div>
                  <div>Voting Power: 1,000 (mock)</div>
                  <div>This vote is final and cannot be changed once cast.</div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleVote} 
                  disabled={!selectedVote || loading}
                >
                  {loading ? "Casting Vote..." : `Cast ${selectedVote || ""} Vote`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Recent Votes */}
        {votes.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Recent Votes
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {votes.slice(0, 5).map((vote) => (
                <div key={vote.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {getVoteIcon(vote.vote_type)}
                    <span className="text-sm font-medium">{vote.voter}</span>
                    <Badge variant="outline" className={getVoteColor(vote.vote_type)}>
                      {vote.vote_type}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTimestamp(vote.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
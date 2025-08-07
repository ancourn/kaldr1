"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, X, Link, FileText } from "lucide-react";

interface CreateProposalProps {
  onProposalCreated?: () => void;
}

interface Link {
  title: string;
  url: string;
  description?: string;
}

export default function CreateProposal({ onProposalCreated }: CreateProposalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    proposal_type: "",
    proposer: "",
    tags: [] as string[],
    links: [] as Link[],
    justification: ""
  });

  const [newTag, setNewTag] = useState("");
  const [newLink, setNewLink] = useState({ title: "", url: "", description: "" });

  const proposalTypes = [
    { value: "protocol_upgrade", label: "Protocol Upgrade" },
    { value: "parameter_change", label: "Parameter Change" },
    { value: "emergency_action", label: "Emergency Action" },
    { value: "treasury_management", label: "Treasury Management" },
    { value: "custom", label: "Custom Proposal" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/governance/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          proposal_type: formData.proposal_type,
          proposer: formData.proposer,
          metadata: {
            tags: formData.tags,
            links: formData.links
          }
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Reset form
        setFormData({
          title: "",
          description: "",
          proposal_type: "",
          proposer: "",
          tags: [],
          links: [],
          justification: ""
        });
        setOpen(false);
        onProposalCreated?.();
      } else {
        console.error('Failed to create proposal:', result.error);
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addLink = () => {
    if (newLink.title.trim() && newLink.url.trim()) {
      setFormData(prev => ({
        ...prev,
        links: [...prev.links, { ...newLink }]
      }));
      setNewLink({ title: "", url: "", description: "" });
    }
  };

  const removeLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Proposal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Proposal</DialogTitle>
          <DialogDescription>
            Submit a new governance proposal for community voting
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Proposal Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter proposal title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of your proposal"
              className="min-h-[120px]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proposal_type">Proposal Type *</Label>
              <Select
                value={formData.proposal_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, proposal_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select proposal type" />
                </SelectTrigger>
                <SelectContent>
                  {proposalTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposer">Proposer *</Label>
              <Input
                id="proposer"
                value={formData.proposer}
                onChange={(e) => setFormData(prev => ({ ...prev, proposer: e.target.value }))}
                placeholder="Your address/identifier"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="justification">Justification</Label>
            <Textarea
              id="justification"
              value={formData.justification}
              onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))}
              placeholder="Explain why this proposal is necessary and its expected impact"
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Links</Label>
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  value={newLink.title}
                  onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Link title"
                />
                <Input
                  value={newLink.url}
                  onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="URL"
                />
                <Button type="button" variant="outline" onClick={addLink}>
                  <Link className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {formData.links.map((link, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{link.title}</span>
                    <span className="text-xs text-muted-foreground">{link.url}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLink(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Proposal Timeline
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium">Discussion Period</div>
                <div className="text-muted-foreground">7 days</div>
              </div>
              <div>
                <div className="font-medium">Voting Period</div>
                <div className="text-muted-foreground">7 days</div>
              </div>
              <div>
                <div className="font-medium">Execution Delay</div>
                <div className="text-muted-foreground">24 hours</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title || !formData.description || !formData.proposal_type || !formData.proposer}>
              {loading ? "Creating..." : "Create Proposal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
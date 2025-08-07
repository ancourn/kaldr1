"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Share2, 
  TrendingUp,
  Award,
  Calendar,
  MapPin,
  Globe,
  Star,
  Zap,
  Target,
  Rocket,
  Gift,
  Trophy,
  BookOpen,
  Video,
  Mic,
  Code,
  DollarSign,
  Building,
  GraduationCap,
  Lightbulb,
  Hash,
  AtSign,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from "lucide-react";

interface CommunityMetrics {
  total_members: number;
  active_members: number;
  monthly_growth: number;
  engagement_rate: number;
  countries: number;
  languages: number;
  social_media_followers: number;
  discord_members: number;
  telegram_members: number;
  twitter_followers: number;
}

interface Event {
  id: string;
  title: string;
  type: 'hackathon' | 'workshop' | 'conference' | 'meetup' | 'webinar';
  date: string;
  location: string;
  participants: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  description: string;
  registration_link?: string;
}

interface Ambassador {
  id: string;
  name: string;
  country: string;
  role: string;
  contributions: number;
  events_organized: number;
  community_score: number;
  join_date: string;
  avatar?: string;
}

interface GrantProgram {
  id: string;
  name: string;
  category: string;
  total_funding: number;
  awarded_projects: number;
  active_projects: number;
  success_rate: number;
  application_deadline: string;
  description: string;
}

interface EducationContent {
  id: string;
  title: string;
  type: 'tutorial' | 'course' | 'documentation' | 'video' | 'podcast';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  views: number;
  rating: number;
  author: string;
  publish_date: string;
}

export default function CommunityPage() {
  const [communityMetrics, setCommunityMetrics] = useState<CommunityMetrics>({
    total_members: 0,
    active_members: 0,
    monthly_growth: 0,
    engagement_rate: 0,
    countries: 0,
    languages: 0,
    social_media_followers: 0,
    discord_members: 0,
    telegram_members: 0,
    twitter_followers: 0
  });

  const [events, setEvents] = useState<Event[]>([]);
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [grantPrograms, setGrantPrograms] = useState<GrantProgram[]>([]);
  const [educationContent, setEducationContent] = useState<EducationContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunityData = async () => {
      // Community Metrics
      setCommunityMetrics({
        total_members: 284750,
        active_members: 187420,
        monthly_growth: 12.5,
        engagement_rate: 78.5,
        countries: 147,
        languages: 23,
        social_media_followers: 542000,
        discord_members: 125000,
        telegram_members: 87500,
        twitter_followers: 329500
      });

      // Events
      setEvents([
        {
          id: 'event-001',
          title: 'Global KALDRIX Hackathon 2024',
          type: 'hackathon',
          date: '2024-12-15',
          location: 'Virtual',
          participants: 2500,
          status: 'upcoming',
          description: '48-hour hackathon focused on quantum-resistant blockchain applications',
          registration_link: 'https://hackathon.kaldrix.com'
        },
        {
          id: 'event-002',
          title: 'Post-Quantum Cryptography Workshop',
          type: 'workshop',
          date: '2024-11-20',
          location: 'San Francisco, USA',
          participants: 150,
          status: 'upcoming',
          description: 'Deep dive into post-quantum cryptography implementation'
        },
        {
          id: 'event-003',
          title: 'KALDRIX Community Meetup Berlin',
          type: 'meetup',
          date: '2024-11-10',
          location: 'Berlin, Germany',
          participants: 80,
          status: 'ongoing',
          description: 'Monthly community meetup and networking event'
        },
        {
          id: 'event-004',
          title: 'Blockchain Security Conference',
          type: 'conference',
          date: '2024-10-25',
          location: 'Singapore',
          participants: 500,
          status: 'completed',
          description: 'Annual conference on blockchain security and quantum resistance'
        }
      ]);

      // Ambassadors
      setAmbassadors([
        {
          id: 'amb-001',
          name: 'Sarah Chen',
          country: 'Singapore',
          role: 'Technical Lead',
          contributions: 147,
          events_organized: 12,
          community_score: 95,
          join_date: '2023-06-15'
        },
        {
          id: 'amb-002',
          name: 'Marcus Weber',
          country: 'Germany',
          role: 'Community Manager',
          contributions: 203,
          events_organized: 18,
          community_score: 98,
          join_date: '2023-03-20'
        },
        {
          id: 'amb-003',
          name: 'Elena Rodriguez',
          country: 'Spain',
          role: 'Developer Advocate',
          contributions: 189,
          events_organized: 15,
          community_score: 92,
          join_date: '2023-08-10'
        },
        {
          id: 'amb-004',
          name: 'Akira Tanaka',
          country: 'Japan',
          role: 'Research Lead',
          contributions: 167,
          events_organized: 8,
          community_score: 89,
          join_date: '2023-09-05'
        }
      ]);

      // Grant Programs
      setGrantPrograms([
        {
          id: 'grant-001',
          name: 'Quantum Resistance Innovation Grant',
          category: 'Research & Development',
          total_funding: 5000000,
          awarded_projects: 24,
          active_projects: 8,
          success_rate: 87,
          application_deadline: '2024-12-31',
          description: 'Funding for innovative quantum-resistant blockchain solutions'
        },
        {
          id: 'grant-002',
          name: 'Ecosystem Development Grant',
          category: 'Community',
          total_funding: 2500000,
          awarded_projects: 18,
          active_projects: 6,
          success_rate: 92,
          application_deadline: '2024-11-30',
          description: 'Support for community projects and ecosystem expansion'
        },
        {
          id: 'grant-003',
          name: 'Educational Content Grant',
          category: 'Education',
          total_funding: 1000000,
          awarded_projects: 32,
          active_projects: 12,
          success_rate: 95,
          application_deadline: '2024-12-15',
          description: 'Funding for educational content and learning resources'
        }
      ]);

      // Education Content
      setEducationContent([
        {
          id: 'edu-001',
          title: 'Introduction to KALDRIX Blockchain',
          type: 'course',
          difficulty: 'beginner',
          duration: '8 hours',
          views: 45200,
          rating: 4.8,
          author: 'Dr. Sarah Chen',
          publish_date: '2024-01-15'
        },
        {
          id: 'edu-002',
          title: 'Post-Quantum Cryptography Deep Dive',
          type: 'video',
          difficulty: 'advanced',
          duration: '2 hours',
          views: 28700,
          rating: 4.9,
          author: 'Prof. Marcus Weber',
          publish_date: '2024-02-20'
        },
        {
          id: 'edu-003',
          title: 'Building DApps on KALDRIX',
          type: 'tutorial',
          difficulty: 'intermediate',
          duration: '6 hours',
          views: 38900,
          rating: 4.7,
          author: 'Elena Rodriguez',
          publish_date: '2024-03-10'
        },
        {
          id: 'edu-004',
          title: 'KALDRIX Developer Podcast',
          type: 'podcast',
          difficulty: 'beginner',
          duration: '45 min',
          views: 52100,
          rating: 4.6,
          author: 'Community Team',
          publish_date: '2024-04-05'
        }
      ]);

      setLoading(false);
    };

    fetchCommunityData();
  }, []);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'hackathon': return 'bg-purple-100 text-purple-800';
      case 'workshop': return 'bg-blue-100 text-blue-800';
      case 'conference': return 'bg-green-100 text-green-800';
      case 'meetup': return 'bg-orange-100 text-orange-800';
      case 'webinar': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500';
      case 'ongoing': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600';
      case 'intermediate': return 'text-yellow-600';
      case 'advanced': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'tutorial': return <BookOpen className="h-4 w-4" />;
      case 'course': return <GraduationCap className="h-4 w-4" />;
      case 'documentation': return <Code className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'podcast': return <Mic className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    return "$" + formatNumber(num);
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
      <section className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative container mx-auto px-6 py-24">
          <div className="text-center space-y-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Users className="h-16 w-16 text-white" />
              <h1 className="text-6xl font-bold">
                Community & Ecosystem
              </h1>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Building a Global Quantum-Resistant Blockchain Community
            </h2>
            <p className="text-xl max-w-4xl mx-auto mb-8 text-orange-100">
              Join our vibrant community of developers, researchers, and enthusiasts working together 
              to advance quantum-resistant blockchain technology. Together, we're building the future 
              of decentralized systems.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50">
                <Rocket className="mr-2 h-5 w-5" />
                Join Community
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-orange-600">
                <MessageCircle className="mr-2 h-5 w-5" />
                Connect Now
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold">{formatNumber(communityMetrics.total_members)}</div>
                <div className="text-sm text-orange-100">Community Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{communityMetrics.countries}</div>
                <div className="text-sm text-orange-100">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{communityMetrics.monthly_growth}%</div>
                <div className="text-sm text-orange-100">Monthly Growth</div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </section>

      <div className="container mx-auto px-6 py-12">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="ambassadors" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Ambassadors
            </TabsTrigger>
            <TabsTrigger value="grants" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Grants
            </TabsTrigger>
            <TabsTrigger value="education" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Education
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(communityMetrics.total_members)}</div>
                  <p className="text-xs text-muted-foreground">+{communityMetrics.monthly_growth}% this month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(communityMetrics.active_members)}</div>
                  <p className="text-xs text-muted-foreground">{communityMetrics.engagement_rate}% engagement</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Countries</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{communityMetrics.countries}</div>
                  <p className="text-xs text-muted-foreground">{communityMetrics.languages} languages</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Social Reach</CardTitle>
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(communityMetrics.social_media_followers)}</div>
                  <p className="text-xs text-muted-foreground">Across all platforms</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Community Platforms
                  </CardTitle>
                  <CardDescription>
                    Active community across different platforms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Discord</span>
                      <span className="font-medium">{formatNumber(communityMetrics.discord_members)}</span>
                    </div>
                    <Progress value={(communityMetrics.discord_members / 150000) * 100} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Telegram</span>
                      <span className="font-medium">{formatNumber(communityMetrics.telegram_members)}</span>
                    </div>
                    <Progress value={(communityMetrics.telegram_members / 100000) * 100} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Twitter</span>
                      <span className="font-medium">{formatNumber(communityMetrics.twitter_followers)}</span>
                    </div>
                    <Progress value={(communityMetrics.twitter_followers / 400000) * 100} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Community Growth
                  </CardTitle>
                  <CardDescription>
                    Monthly growth and engagement metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Monthly Growth</span>
                      <span className="font-medium">{communityMetrics.monthly_growth}%</span>
                    </div>
                    <Progress value={communityMetrics.monthly_growth * 8} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Engagement Rate</span>
                      <span className="font-medium">{communityMetrics.engagement_rate}%</span>
                    </div>
                    <Progress value={communityMetrics.engagement_rate} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">New Members:</span>
                      <span className="ml-1 font-medium">31.5K/month</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Retention:</span>
                      <span className="ml-1 font-medium">87%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{events.length}</div>
                  <p className="text-xs text-muted-foreground">Community events</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {events.filter(e => e.status === 'upcoming').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Ready to join</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(events.reduce((sum, e) => sum + e.participants, 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Event attendees</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Events
                </CardTitle>
                <CardDescription>
                  Join our community events and connect with fellow enthusiasts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.filter(e => e.status === 'upcoming' || e.status === 'ongoing').map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(event.status)}`}></div>
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">{event.type} • {event.location}</p>
                          <p className="text-xs text-muted-foreground">{event.date} • {event.participants} participants</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getEventTypeColor(event.type)}>
                          {event.type}
                        </Badge>
                        {event.registration_link && (
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Register
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ambassadors Tab */}
          <TabsContent value="ambassadors" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Ambassadors</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ambassadors.length}</div>
                  <p className="text-xs text-muted-foreground">Community leaders</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(ambassadors.reduce((sum, a) => sum + a.contributions, 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Community contributions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Events Organized</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {ambassadors.reduce((sum, a) => sum + a.events_organized, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Community events</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Community Score</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(ambassadors.reduce((sum, a) => sum + a.community_score, 0) / ambassadors.length)}
                  </div>
                  <p className="text-xs text-muted-foreground">Community impact</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Community Ambassadors
                </CardTitle>
                <CardDescription>
                  Meet our dedicated community ambassadors and leaders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ambassadors.map((ambassador) => (
                    <div key={ambassador.id} className="flex items-center gap-4 p-4 rounded-lg border">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 flex items-center justify-center text-white font-bold">
                        {ambassador.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{ambassador.name}</h4>
                        <p className="text-sm text-muted-foreground">{ambassador.role} • {ambassador.country}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span>{ambassador.contributions} contributions</span>
                          <span>{ambassador.events_organized} events</span>
                          <span>{ambassador.community_score} score</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Grants Tab */}
          <TabsContent value="grants" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(grantPrograms.reduce((sum, g) => sum + g.total_funding, 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Available funding</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Awarded Projects</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {grantPrograms.reduce((sum, g) => sum + g.awarded_projects, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Projects funded</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {grantPrograms.reduce((sum, g) => sum + g.active_projects, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Currently active</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(grantPrograms.reduce((sum, g) => sum + g.success_rate, 0) / grantPrograms.length)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Project success</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Grant Programs
                </CardTitle>
                <CardDescription>
                  Funding opportunities for community projects and ecosystem development
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {grantPrograms.map((grant) => (
                    <div key={grant.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex-1">
                        <h4 className="font-medium">{grant.name}</h4>
                        <p className="text-sm text-muted-foreground">{grant.category}</p>
                        <p className="text-xs text-muted-foreground mt-1">{grant.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span>{formatCurrency(grant.total_funding)}</span>
                          <span>{grant.awarded_projects} awarded</span>
                          <span>{grant.active_projects} active</span>
                          <span>{grant.success_rate}% success</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{grant.category}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Deadline: {grant.application_deadline}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{educationContent.length}</div>
                  <p className="text-xs text-muted-foreground">Educational resources</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(educationContent.reduce((sum, c) => sum + c.views, 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Content views</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(educationContent.reduce((sum, c) => sum + c.rating, 0) / educationContent.length).toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">Out of 5.0</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Content Types</CardTitle>
                  <Hash className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-muted-foreground">Different formats</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Educational Content
                </CardTitle>
                <CardDescription>
                  Learn about KALDRIX and quantum-resistant blockchain technology
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {educationContent.map((content) => (
                    <div key={content.id} className="flex items-center gap-4 p-4 rounded-lg border">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 text-orange-600">
                        {getContentTypeIcon(content.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{content.title}</h4>
                        <p className="text-sm text-muted-foreground">{content.type} • {content.duration}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className={getDifficultyColor(content.difficulty)}>
                            {content.difficulty}
                          </span>
                          <span>{formatNumber(content.views)} views</span>
                          <span>⭐ {content.rating}</span>
                          <span>by {content.author}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
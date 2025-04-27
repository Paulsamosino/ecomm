import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  Bird,
  Calendar,
  ChevronRight,
  FileText,
  Heart,
  Info,
  LineChart,
  Loader2,
  Plus,
  Settings,
  Target,
  Dna,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Import breeding components
import BreedingProjectManager from "@/components/seller/BreedingProjectManager";
import BreedingPairManager from "@/components/breeding/BreedingPairManager";
import BreedingCalculator from "@/components/breeding/BreedingCalculator";
import BreedingAnalytics from "@/components/breeding/BreedingAnalytics";
import BreedCompatibilityAssistant from "@/components/breeding/BreedCompatibilityAssistant";
import GeneticOutcomePredictor from "@/components/breeding/GeneticOutcomePredictor";
import BreedingTraitGuide from "@/components/breeding/BreedingTraitGuide";
import BreedingStockFinder from "@/components/breeding/BreedingStockFinder";
import breedingService from "@/services/breedingService";

const BreedingManagementPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activePairs: 0,
    successRate: 0,
    upcomingHatches: 0,
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const statsData = await breedingService.getBreedingStats();
      setStats(statsData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const DashboardCard = ({ title, value, icon: Icon, description }) => (
    <Card className="breeding-stats-card shadow-md border border-[#ffb464]/30 hover:border-[#ffb464] transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-[#ffb464]" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-sm text-gray-500">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Breeding Management
        </h1>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-transparent h-auto p-0">
          {[
            { id: "overview", label: "Overview", icon: LineChart },
            { id: "projects", label: "Projects", icon: FileText },
            { id: "breeding", label: "Breeding Tools", icon: Dna },
            { id: "stock", label: "Stock", icon: Bird },
          ].map(({ id, label, icon: Icon }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="data-[state=active]:bg-[#ffb464] data-[state=active]:text-white flex items-center gap-2 h-20 border-2 border-[#ffb464]/30 hover:border-[#ffb464] transition-all"
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="flex justify-center items-center h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-[#ffb464]" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <DashboardCard
                  title="Total Projects"
                  value={stats.totalProjects}
                  icon={FileText}
                  description="Active breeding projects"
                />
                <DashboardCard
                  title="Active Pairs"
                  value={stats.activePairs}
                  icon={Heart}
                  description="Currently breeding pairs"
                />
                <DashboardCard
                  title="Success Rate"
                  value={`${stats.successRate}%`}
                  icon={Target}
                  description="Overall breeding success"
                />
                <DashboardCard
                  title="Upcoming Hatches"
                  value={stats.upcomingHatches}
                  icon={Calendar}
                  description="Expected in next 7 days"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your latest breeding activities and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BreedingAnalytics />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="projects">
          <BreedingProjectManager />
        </TabsContent>

        <TabsContent value="breeding" className="space-y-6">
          <Tabs defaultValue="calculator" className="w-full">
            <TabsList className="w-full justify-start h-12 bg-transparent p-0 space-x-2">
              {[
                { value: "calculator", label: "Calculator", icon: Dna },
                {
                  value: "compatibility",
                  label: "Compatibility",
                  icon: AlertCircle,
                },
                { value: "pairs", label: "Pairs", icon: Heart },
                { value: "traits", label: "Traits", icon: Target },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="data-[state=active]:bg-[#ffb464] data-[state=active]:text-white px-4"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-6">
              <TabsContent value="calculator">
                <BreedingCalculator onCalculate={loadDashboardData} />
              </TabsContent>
              <TabsContent value="compatibility">
                <BreedCompatibilityAssistant />
              </TabsContent>
              <TabsContent value="pairs">
                <BreedingPairManager onUpdate={loadDashboardData} />
              </TabsContent>
              <TabsContent value="traits">
                <BreedingTraitGuide />
              </TabsContent>
            </div>
          </Tabs>
        </TabsContent>

        <TabsContent value="stock" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Breeding Stock Management</CardTitle>
              <CardDescription>
                Find and manage your breeding stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="finder" className="w-full">
                <TabsList>
                  <TabsTrigger value="finder">Stock Finder</TabsTrigger>
                  <TabsTrigger value="genetics">Genetics</TabsTrigger>
                </TabsList>
                <TabsContent value="finder">
                  <BreedingStockFinder />
                </TabsContent>
                <TabsContent value="genetics">
                  <GeneticOutcomePredictor />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BreedingManagementPage;

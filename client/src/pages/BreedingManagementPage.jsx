import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { breedingService } from "@/services/breedingService";
import { toast } from "react-hot-toast";
import {
  LayoutGrid,
  ClipboardList,
  Users,
  Calculator,
  LineChart,
  Book,
  Dna,
  Search,
  Bird,
  Egg,
  Sun,
  CloudRain,
  Leaf,
  Zap,
  PieChart,
  BarChart3,
  Award,
  ArrowUpRight,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Import breeding components
import BreedingProjectManager from "@/components/breeding/BreedingProjectManager";
import BreedingPairManager from "@/components/breeding/BreedingPairManager";
import BreedingCalculator from "@/components/breeding/BreedingCalculator";
import BreedingAnalytics from "@/components/breeding/BreedingAnalytics";
import BreedingTraitGuide from "@/components/breeding/BreedingTraitGuide";
import BreedingTracker from "@/components/breeding/BreedingTracker";
import BreedingLineage from "@/components/breeding/BreedingLineage";
import BreedCompatibilityAssistant from "@/components/breeding/BreedCompatibilityAssistant";
import GeneticOutcomePredictor from "@/components/breeding/GeneticOutcomePredictor";
import BreedingStockFinder from "@/components/breeding/BreedingStockFinder";

const BreedingManagementPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [pureBreeds, setPureBreeds] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activePairs: 0,
    successRate: 0,
    upcomingHatches: 0,
  });

  useEffect(() => {
    // Load pure breeds
    const loadPureBreeds = async () => {
      try {
        const breeds = await breedingService.getBreeds();
        setPureBreeds(breeds);
      } catch (error) {
        console.error("Failed to load breeds:", error);
        toast.error("Failed to load breeds");
      }
    };

    // Load stats
    const loadStats = async () => {
      try {
        // Get projects count
        const projects = await breedingService.getBreedingProjects();
        const activeProjects = projects.filter(
          (p) => p.status === "active"
        ).length;

        // Get pairs count
        const pairs = await breedingService.getBreedingPairs();
        const activePairs = pairs.filter(
          (p) => p.status === "active" || p.status === "breeding"
        ).length;

        // Get success rate from analytics
        const analytics = await breedingService.getBreedingAnalytics("6");

        // Get upcoming hatches
        const upcomingHatches = pairs.filter(
          (p) => p.status === "pregnant"
        ).length;

        setStats({
          totalProjects: activeProjects,
          activePairs,
          successRate: analytics?.successRate || 0,
          upcomingHatches,
        });
      } catch (error) {
        console.error("Failed to load stats:", error);
      }
    };

    loadPureBreeds();
    loadStats();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Animated background elements */}
      <div className="relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#fcba6d]/10 rounded-full blur-[80px] animate-pulse-slow" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#e8f4ea]/30 rounded-full blur-[100px] animate-pulse-slow" />
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 relative">
        <div>
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#fff0dd] text-[#cd8539] text-sm font-medium mb-4 shadow-sm animate-float">
            <Bird className="h-4 w-4 mr-2" />
            <span className="relative">Breeding Center</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#cd8539]">
            Breeding Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your breeding projects, pairs, and analytics
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <Badge
            variant="outline"
            className="px-4 py-2 bg-[#fff0dd] text-[#cd8539] border-[#ffecd4] flex items-center gap-2"
          >
            <Award className="h-4 w-4" />
            {pureBreeds.length} Breeds Available
          </Badge>
          <Button
            variant="outline"
            className="border-[#ffecd4] text-[#cd8539] hover:bg-[#fff0dd] hover:text-[#cd8539]"
          >
            <Bird className="h-4 w-4 mr-2" />
            Add New Breed
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-[#ffecd4] bg-white hover:bg-[#fff8ef]/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[#fcba6d]" />
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-3xl font-bold text-[#cd8539]">
                {stats.totalProjects}
              </div>
              <Badge
                variant="outline"
                className="ml-2 bg-green-50 text-green-600 border-green-100"
              >
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12%
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#ffecd4] bg-white hover:bg-[#fff8ef]/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#fcba6d]" />
              Active Pairs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-3xl font-bold text-[#cd8539]">
                {stats.activePairs}
              </div>
              <Badge
                variant="outline"
                className="ml-2 bg-green-50 text-green-600 border-green-100"
              >
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +5%
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#ffecd4] bg-white hover:bg-[#fff8ef]/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Egg className="h-4 w-4 text-[#fcba6d]" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-3xl font-bold text-[#cd8539]">
                {stats.successRate}%
              </div>
              <Badge
                variant="outline"
                className="ml-2 bg-green-50 text-green-600 border-green-100"
              >
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +8%
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#ffecd4] bg-white hover:bg-[#fff8ef]/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#fcba6d]" />
              Upcoming Hatches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-3xl font-bold text-[#cd8539]">
                {stats.upcomingHatches}
              </div>
              <Badge
                variant="outline"
                className="ml-2 bg-amber-50 text-amber-600 border-amber-100"
              >
                <ChevronRight className="h-3 w-3 mr-1" />
                Next: 3d
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-xl border border-[#ffecd4] shadow-sm overflow-hidden">
        <Tabs
          defaultValue={activeTab}
          onValueChange={setActiveTab}
          className="space-y-0"
        >
          <div className="border-b border-[#ffecd4] bg-[#fff8ef]/50 px-4">
            <TabsList className="h-16 bg-transparent grid w-full grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-1">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-white data-[state=active]:text-[#cd8539] data-[state=active]:shadow-sm flex items-center gap-2 rounded-t-lg"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden md:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="projects"
                className="data-[state=active]:bg-white data-[state=active]:text-[#cd8539] data-[state=active]:shadow-sm flex items-center gap-2 rounded-t-lg"
              >
                <ClipboardList className="h-4 w-4" />
                <span className="hidden md:inline">Projects</span>
              </TabsTrigger>
              <TabsTrigger
                value="pairs"
                className="data-[state=active]:bg-white data-[state=active]:text-[#cd8539] data-[state=active]:shadow-sm flex items-center gap-2 rounded-t-lg"
              >
                <Users className="h-4 w-4" />
                <span className="hidden md:inline">Pairs</span>
              </TabsTrigger>
              <TabsTrigger
                value="calculator"
                className="data-[state=active]:bg-white data-[state=active]:text-[#cd8539] data-[state=active]:shadow-sm flex items-center gap-2 rounded-t-lg"
              >
                <Calculator className="h-4 w-4" />
                <span className="hidden md:inline">Calculator</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-white data-[state=active]:text-[#cd8539] data-[state=active]:shadow-sm flex items-center gap-2 rounded-t-lg"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden md:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger
                value="lineage"
                className="data-[state=active]:bg-white data-[state=active]:text-[#cd8539] data-[state=active]:shadow-sm flex items-center gap-2 rounded-t-lg"
              >
                <Zap className="h-4 w-4" />
                <span className="hidden md:inline">Lineage</span>
              </TabsTrigger>
              <TabsTrigger
                value="compatibility"
                className="data-[state=active]:bg-white data-[state=active]:text-[#cd8539] data-[state=active]:shadow-sm flex items-center gap-2 rounded-t-lg"
              >
                <PieChart className="h-4 w-4" />
                <span className="hidden md:inline">Compatibility</span>
              </TabsTrigger>
              <TabsTrigger
                value="genetics"
                className="data-[state=active]:bg-white data-[state=active]:text-[#cd8539] data-[state=active]:shadow-sm flex items-center gap-2 rounded-t-lg"
              >
                <Dna className="h-4 w-4" />
                <span className="hidden md:inline">Genetics</span>
              </TabsTrigger>
              <TabsTrigger
                value="stockfinder"
                className="data-[state=active]:bg-white data-[state=active]:text-[#cd8539] data-[state=active]:shadow-sm flex items-center gap-2 rounded-t-lg"
              >
                <Search className="h-4 w-4" />
                <span className="hidden md:inline">Stock Finder</span>
              </TabsTrigger>
              <TabsTrigger
                value="guide"
                className="data-[state=active]:bg-white data-[state=active]:text-[#cd8539] data-[state=active]:shadow-sm flex items-center gap-2 rounded-t-lg"
              >
                <Book className="h-4 w-4" />
                <span className="hidden md:inline">Guide</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="p-6 m-0 border-0">
            <BreedingTracker />
          </TabsContent>

          <TabsContent value="projects" className="p-6 m-0 border-0">
            <BreedingProjectManager />
          </TabsContent>

          <TabsContent value="pairs" className="p-6 m-0 border-0">
            <BreedingPairManager />
          </TabsContent>

          <TabsContent value="calculator" className="p-6 m-0 border-0">
            <BreedingCalculator />
          </TabsContent>

          <TabsContent value="analytics" className="p-6 m-0 border-0">
            <BreedingAnalytics />
          </TabsContent>

          <TabsContent value="lineage" className="p-6 m-0 border-0">
            <BreedingLineage />
          </TabsContent>

          <TabsContent value="compatibility" className="p-6 m-0 border-0">
            <BreedCompatibilityAssistant />
          </TabsContent>

          <TabsContent value="guide" className="p-6 m-0 border-0">
            <BreedingTraitGuide />
          </TabsContent>

          <TabsContent value="genetics" className="p-6 m-0 border-0">
            <GeneticOutcomePredictor />
          </TabsContent>

          <TabsContent value="stockfinder" className="p-6 m-0 border-0">
            <BreedingStockFinder />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BreedingManagementPage;

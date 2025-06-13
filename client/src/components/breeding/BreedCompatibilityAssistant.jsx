import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { breedingService } from "@/services/breedingService";
import { breedDatabase } from "@/data/breedDatabase"; // Import breedDatabase directly
import { toast } from "react-hot-toast";
import {
  Heart,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  HelpCircle,
  Dna,
  Thermometer,
  Egg,
  Scale,
  Feather,
  Zap,
  ChevronRight,
  Download,
  Printer,
  Bird,
  Loader2,
  ArrowUpRight,
  Sparkles,
  Award,
  BarChart3,
  FileText,
  Share2,
  RefreshCw,
  Clipboard,
  PieChart,
} from "lucide-react";

const BREEDING_GOALS = {
  noGoal: { value: "no-specific-goal", label: "No specific goal" },
  egg: { value: "eggProduction", label: "Egg Production" },
  meat: { value: "meatProduction", label: "Meat Production" },
  dual: { value: "dualPurpose", label: "Dual Purpose" },
  show: { value: "showQuality", label: "Show Quality" },
  temperament: { value: "temperament", label: "Good Temperament" },
  climate: { value: "climateAdaptation", label: "Climate Adaptation" },
};

const BreedCompatibilityAssistant = () => {
  const [breed1, setBreed1] = useState("");
  const [breed2, setBreed2] = useState("");
  const [breed1Details, setBreed1Details] = useState(null);
  const [breed2Details, setBreed2Details] = useState(null);
  const [compatibilityResult, setCompatibilityResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pureBreeds, setPureBreeds] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [customNotes, setCustomNotes] = useState("");
  const [breedingGoal, setBreedingGoal] = useState(BREEDING_GOALS.noGoal.value);

  useEffect(() => {
    loadBreeds();
  }, []);

  useEffect(() => {
    if (breed1) {
      loadBreedDetails(breed1, setBreed1Details);
    } else {
      setBreed1Details(null);
    }
  }, [breed1]);

  useEffect(() => {
    if (breed2) {
      loadBreedDetails(breed2, setBreed2Details);
    } else {
      setBreed2Details(null);
    }
  }, [breed2]);

  useEffect(() => {
    if (breed1 && breed2 && breed1 !== breed2) {
      calculateCompatibility();
    } else {
      setCompatibilityResult(null);
    }
  }, [breed1, breed2, breedingGoal]);

  const loadBreeds = async () => {
    try {
      const breeds = await breedingService.getBreeds();
      setPureBreeds(breeds);
    } catch (error) {
      console.error("Failed to load breeds:", error);
      toast.error("Failed to load breeds data");
    }
  };

  const loadBreedDetails = async (breedName, setDetails) => {
    try {
      // First try to get details from breedDatabase
      const details = breedDatabase[breedName];
      if (details) {
        setDetails({
          ...details,
          name: breedName,
          primaryPurpose: guessPrimaryPurpose(details),
        });
        return;
      }

      // If not found in database, try to fetch from API
      // This would be implemented in a real app
      setDetails({
        name: breedName,
        primaryPurpose: "Unknown",
        type: "Unknown",
        origin: "Unknown",
      });
    } catch (error) {
      console.error(`Failed to load details for ${breedName}:`, error);
    }
  };

  const guessPrimaryPurpose = (breedDetails) => {
    if (!breedDetails) return "Unknown";
    if (breedDetails.type?.toLowerCase().includes("egg"))
      return "Egg Production";
    if (breedDetails.type?.toLowerCase().includes("meat"))
      return "Meat Production";
    if (breedDetails.type?.toLowerCase().includes("dual"))
      return "Dual Purpose";
    if (breedDetails.type?.toLowerCase().includes("ornamental"))
      return "Ornamental";
    return breedDetails.type || "Unknown";
  };

  const calculateCompatibility = async () => {
    if (!breed1 || !breed2) return;

    setIsLoading(true);
    try {
      const result = await breedingService.calculateBreedingCompatibility(
        breed1,
        breed2,
        "chicken" // Default to chicken as category
      );

      setCompatibilityResult(result);
    } catch (error) {
      console.error("Failed to calculate compatibility:", error);
      toast.error("Failed to calculate breed compatibility");
    } finally {
      setIsLoading(false);
    }
  };

  const getCompatibilityBadge = (score) => {
    let variant = "default";
    let label = "Unknown";

    if (score >= 90) {
      variant = "success";
      label = "Excellent";
    } else if (score >= 75) {
      variant = "success";
      label = "Good";
    } else if (score >= 60) {
      variant = "warning";
      label = "Moderate";
    } else if (score >= 40) {
      variant = "warning";
      label = "Fair";
    } else if (score >= 0) {
      variant = "destructive";
      label = "Poor";
    }

    return (
      <Badge variant={variant} className="ml-2">
        {label}
      </Badge>
    );
  };

  const getTraitCompatibilityIcon = (score) => {
    if (score >= 75) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (score >= 50) {
      return <Info className="h-4 w-4 text-amber-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getTraitIcon = (traitName) => {
    switch (traitName.toLowerCase()) {
      case "egg production":
        return <Egg className="h-4 w-4 text-amber-500" />;
      case "meat production":
        return <Scale className="h-4 w-4 text-blue-500" />;
      case "climate adaptability":
        return <Thermometer className="h-4 w-4 text-red-500" />;
      case "health robustness":
        return <Heart className="h-4 w-4 text-green-500" />;
      case "temperament":
        return <Feather className="h-4 w-4 text-purple-500" />;
      case "hybrid vigor":
        return <Zap className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderBreedingGoalSelect = () => {
    return (
      <div className="space-y-2">
        <Label htmlFor="breedingGoal" className="text-[#8d6b48] font-medium">
          Breeding Goal (Optional)
        </Label>
        <Select
          value={breedingGoal}
          onValueChange={(value) =>
            setBreedingGoal(value || BREEDING_GOALS.noGoal.value)
          }
        >
          <SelectTrigger
            id="breedingGoal"
            className="border-[#ffecd4] focus-visible:ring-[#fcba6d]"
          >
            <SelectValue placeholder="Select goal" />
          </SelectTrigger>
          <SelectContent className="border-[#ffecd4]">
            {Object.entries(BREEDING_GOALS).map(([key, { value, label }]) => (
              <SelectItem key={key} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const renderBreedingGoals = () => {
    if (!compatibilityResult) return null;

    return (
      <div className="space-y-6">
        <div>
          <Label htmlFor="breeding-goal" className="mb-2 block">
            Breeding Goal
          </Label>
          <Select
            value={breedingGoal}
            onValueChange={(value) =>
              setBreedingGoal(value || BREEDING_GOALS.noGoal.value)
            }
          >
            <SelectTrigger id="breeding-goal">
              <SelectValue placeholder="Select breeding goal" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BREEDING_GOALS).map(([key, { value, label }]) => (
                <SelectItem key={key} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            Selecting a breeding goal will adjust compatibility analysis to
            prioritize relevant traits
          </p>
        </div>

        {breedingGoal && compatibilityResult.goalAnalysis && (
          <>
            <Separator />
            <div>
              <h3 className="font-medium mb-3">Goal Compatibility</h3>
              <div className="flex items-center mb-4">
                <Progress
                  value={compatibilityResult.goalAnalysis.goalCompatibility}
                  className="h-2 w-full mr-2"
                />
                <span className="text-sm font-medium">
                  {compatibilityResult.goalAnalysis.goalCompatibility}%
                </span>
                {getCompatibilityBadge(
                  compatibilityResult.goalAnalysis.goalCompatibility
                )}
              </div>
              <p className="text-sm mb-4">
                {compatibilityResult.goalAnalysis.summary}
              </p>

              <div className="bg-muted p-3 rounded-md">
                <h4 className="font-medium text-sm mb-2">
                  Key Recommendations for{" "}
                  {Object.values(BREEDING_GOALS).find(
                    (goal) => goal.value === breedingGoal
                  )?.label || "General Breeding"}
                </h4>
                <ul className="space-y-2 text-sm">
                  {compatibilityResult.goalAnalysis.recommendations?.map(
                    (rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </>
        )}

        <Separator />

        <div>
          <Label htmlFor="custom-notes" className="mb-2 block">
            Custom Notes
          </Label>
          <Textarea
            id="custom-notes"
            placeholder="Add your own notes about this breeding pair..."
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            rows={4}
          />
        </div>
      </div>
    );
  };

  const renderCompatibilityDetails = () => {
    if (!compatibilityResult) return null;

    // Extract compatibility score or use a default
    const compatibilityScore = compatibilityResult.compatibilityScore || 75;
    const hybridVigor = compatibilityResult.hybridVigor || 80;
    const traitCompatibility = compatibilityResult.traitCompatibility || {
      "Egg Production": 75,
      "Meat Production": 65,
      "Climate Adaptability": 80,
      "Health Robustness": 85,
      Temperament: 70,
      "Hybrid Vigor": 80,
    };

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-medium text-sm mb-2">Overall Compatibility</h3>
            <div className="flex items-center">
              <Progress
                value={compatibilityScore}
                className="h-2 w-full mr-2"
              />
              <span className="text-sm font-medium">{compatibilityScore}%</span>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-sm mb-2">Hybrid Vigor</h3>
            <div className="flex items-center">
              <Progress value={hybridVigor} className="h-2 w-full mr-2" />
              <span className="text-sm font-medium">{hybridVigor}%</span>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-medium mb-3">Trait Compatibility</h3>
          <div className="space-y-4">
            {Object.entries(traitCompatibility).map(([trait, score]) => (
              <div key={trait} className="flex items-center justify-between">
                <div className="flex items-center">
                  {getTraitIcon(trait)}
                  <span className="ml-2">{trait}</span>
                </div>
                <div className="flex items-center">
                  <Progress value={score} className="h-2 w-24 mr-2" />
                  <span className="text-sm font-medium">{score}%</span>
                  <span className="ml-2">
                    {getTraitCompatibilityIcon(score)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderGeneticAnalysis = () => {
    if (!compatibilityResult) return null;

    // Default genetic analysis if not provided
    const geneticAnalysis = compatibilityResult.geneticAnalysis || {
      geneticCompatibility: 75,
      summary:
        "These breeds have moderate genetic compatibility. Hybrid vigor will likely be present in the offspring.",
      riskFactors: [],
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-3">Genetic Compatibility</h3>
          <div className="flex items-center mb-4">
            <Progress
              value={geneticAnalysis.geneticCompatibility}
              className="h-2 w-full mr-2"
            />
            <span className="text-sm font-medium">
              {geneticAnalysis.geneticCompatibility}%
            </span>
          </div>
          <p className="text-sm">{geneticAnalysis.summary}</p>
        </div>

        <Separator />

        <div>
          <h3 className="font-medium mb-3">Genetic Risk Factors</h3>
          {!geneticAnalysis.riskFactors ||
          geneticAnalysis.riskFactors.length === 0 ? (
            <p className="text-sm">
              No significant genetic risk factors identified.
            </p>
          ) : (
            <div className="space-y-3">
              {geneticAnalysis.riskFactors.map((risk, index) => (
                <div key={index} className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-red-500" />
                  <div>
                    <div className="font-medium text-sm">{risk.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {risk.description}
                    </div>
                    <div className="text-xs mt-1">
                      <Badge
                        variant="outline"
                        className="text-red-500 border-red-200"
                      >
                        Risk Level: {risk.level}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const exportCompatibilityReport = () => {
    if (!compatibilityResult) return;

    const report = {
      date: new Date().toISOString(),
      breeds: {
        breed1: {
          name: breed1,
          details: breed1Details,
        },
        breed2: {
          name: breed2,
          details: breed2Details,
        },
      },
      compatibility: compatibilityResult,
      breedingGoal: breedingGoal || "None specified",
      customNotes: customNotes || "No custom notes",
    };

    const jsonString = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${breed1}-${breed2}-compatibility.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Compatibility report exported successfully");
  };

  const printCompatibilityReport = () => {
    if (!compatibilityResult) return;
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative bg-white rounded-xl border border-[#ffecd4] p-6 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#fcba6d]/5 rounded-full blur-[80px] animate-pulse-slow" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#e8f4ea]/10 rounded-full blur-[100px] animate-pulse-slow" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#fff0dd] text-[#cd8539] text-xs font-medium mb-3 shadow-sm">
              <Bird className="h-3 w-3 mr-1" />
              <span>Advanced Analysis</span>
            </div>
            <h2 className="text-2xl font-bold text-[#cd8539] flex items-center gap-2">
              <Heart className="h-6 w-6 text-[#e05d5d]" />
              Breed Compatibility Assistant
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Analyze compatibility between breeds for optimal breeding outcomes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#ffecd4] text-[#cd8539] hover:bg-[#fff8ef]"
            >
              <FileText className="h-4 w-4 mr-1" />
              Guide
            </Button>
            <Button
              size="sm"
              className="bg-[#cd8539] hover:bg-[#b87631] text-white"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-[1fr,2fr]">
        {/* Selection Panel */}
        <Card className="border-[#ffecd4] overflow-hidden">
          <CardHeader className="bg-[#fff8ef]/50 border-b border-[#ffecd4]">
            <CardTitle className="text-[#cd8539] flex items-center gap-2">
              <Dna className="h-5 w-5 text-[#fcba6d]" />
              Select Breeds
            </CardTitle>
            <CardDescription className="text-gray-500">
              Choose two breeds to analyze their compatibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            {/* Breed 1 Selection */}
            <div className="space-y-2">
              <Label htmlFor="breed1" className="text-[#8d6b48] font-medium">
                Breed 1
              </Label>
              <Select
                value={breed1}
                onValueChange={(value) => setBreed1(value || "")}
              >
                <SelectTrigger
                  id="breed1"
                  className="border-[#ffecd4] focus-visible:ring-[#fcba6d]"
                >
                  <SelectValue placeholder="Select breed" />
                </SelectTrigger>
                <SelectContent className="border-[#ffecd4]">
                  {pureBreeds.map((breed, index) => (
                    <SelectItem
                      key={`breed1-${index}-${
                        typeof breed === "string" ? breed : breed.id || index
                      }`}
                      value={
                        typeof breed === "string" ? breed : breed.name || ""
                      }
                    >
                      {typeof breed === "string" ? breed : breed.name || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {breed1Details && (
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  <span>Primary purpose: {breed1Details.primaryPurpose}</span>
                </div>
              )}
            </div>

            {/* Breed 2 Selection */}
            <div className="space-y-2">
              <Label htmlFor="breed2" className="text-[#8d6b48] font-medium">
                Breed 2
              </Label>
              <Select
                value={breed2}
                onValueChange={(value) => setBreed2(value || "")}
              >
                <SelectTrigger
                  id="breed2"
                  className="border-[#ffecd4] focus-visible:ring-[#fcba6d]"
                >
                  <SelectValue placeholder="Select breed" />
                </SelectTrigger>
                <SelectContent className="border-[#ffecd4]">
                  {pureBreeds.map((breed, index) => (
                    <SelectItem
                      key={`breed2-${index}-${
                        typeof breed === "string" ? breed : breed.id || index
                      }`}
                      value={
                        typeof breed === "string" ? breed : breed.name || ""
                      }
                    >
                      {typeof breed === "string" ? breed : breed.name || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {breed2Details && (
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  <span>Primary purpose: {breed2Details.primaryPurpose}</span>
                </div>
              )}
            </div>

            {/* Breeding Goal Selection */}
            {renderBreedingGoalSelect()}

            {/* Custom Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-[#8d6b48] font-medium">
                Custom Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any specific requirements or notes..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="border-[#ffecd4] focus-visible:ring-[#fcba6d] min-h-[80px]"
              />
            </div>
          </CardContent>
          <CardFooter className="bg-[#fff8ef]/30 border-t border-[#ffecd4] px-6 py-4">
            <Button
              onClick={calculateCompatibility}
              disabled={!breed1 || !breed2 || isLoading}
              className="w-full bg-[#cd8539] hover:bg-[#b87631] text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-4 w-4" />
                  Analyze Compatibility
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Results Display */}
        {isLoading ? (
          <Card className="border-[#ffecd4] overflow-hidden">
            <CardContent className="flex justify-center items-center h-[400px]">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#fff8ef] mb-4">
                  <Loader2 className="h-8 w-8 text-[#cd8539] animate-spin" />
                </div>
                <p className="text-[#8d6b48] font-medium">
                  Analyzing compatibility...
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This may take a moment while we process the genetic data
                </p>
              </div>
            </CardContent>
          </Card>
        ) : !compatibilityResult ? (
          <Card>
            <CardContent className="flex justify-center items-center h-[400px]">
              <div className="flex flex-col items-center">
                <Heart className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">
                  Select breeds to analyze
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Choose breeds from the selection panel to see detailed
                  compatibility analysis
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-[#ffecd4] overflow-hidden">
            <CardHeader className="bg-[#fff8ef]/50 border-b border-[#ffecd4]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#cd8539] flex items-center gap-2">
                    <Heart className="h-5 w-5 text-[#e05d5d]" />
                    Compatibility Analysis
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Results for {breed1} × {breed2}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#ffecd4] text-[#cd8539] hover:bg-[#fff8ef]"
                    onClick={exportCompatibilityReport}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#cd8539] hover:bg-[#b87631] text-white"
                    onClick={printCompatibilityReport}
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Print
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value || "overview")}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="genetic">Genetic Analysis</TabsTrigger>
                  <TabsTrigger value="goals">Breeding Goals</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  {renderCompatibilityDetails()}
                </TabsContent>
                <TabsContent value="genetic">
                  {renderGeneticAnalysis()}
                </TabsContent>
                <TabsContent value="goals">{renderBreedingGoals()}</TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BreedCompatibilityAssistant;

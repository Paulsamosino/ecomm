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
  Target,
} from "lucide-react";

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
  const [breedingGoal, setBreedingGoal] = useState("");

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
    if (breed1 && breed2 && breed1Details && breed2Details) {
      calculateCompatibility();
    } else {
      setCompatibilityResult(null);
    }
  }, [breed1, breed2, breed1Details, breed2Details, breedingGoal]);

  const loadBreeds = async () => {
    try {
      const breeds = await breedingService.getBreeds();
      // Make sure we're handling breeds in a consistent format
      const formattedBreeds = breeds.map((breed) =>
        typeof breed === "string" ? { id: breed, name: breed } : breed
      );
      setPureBreeds(formattedBreeds);
    } catch (error) {
      console.error("Failed to load breeds:", error);
      toast.error("Failed to load breeds");
    }
  };

  const loadBreedDetails = async (breedName, setBreedDetails) => {
    try {
      const details = await breedingService.getBreedDetails(breedName);
      setBreedDetails(details);
    } catch (error) {
      console.error(`Failed to load details for ${breedName}:`, error);
      toast.error(`Failed to load details for ${breedName}`);
    }
  };

  const calculateCompatibility = async () => {
    if (!breed1 || !breed2 || !breed1Details || !breed2Details) return;

    setIsLoading(true);
    try {
      const result = await breedingService.calculateBreedingCompatibility(
        breed1,
        breed2,
        {
          detailedAnalysis: true,
          breedingGoal: breedingGoal || undefined,
        }
      );
      setCompatibilityResult(result);
    } catch (error) {
      console.error("Failed to calculate compatibility:", error);
      toast.error("Failed to calculate compatibility");
    } finally {
      setIsLoading(false);
    }
  };

  const getCompatibilityBadge = (score) => {
    let variant = "default";
    let label = "Unknown";
    let color = "text-gray-500";
    let bgColor = "bg-gray-100";

    if (score >= 90) {
      variant = "success";
      label = "Excellent";
      color = "text-[#5c8d6a]";
      bgColor = "bg-[#e8f4ea]";
    } else if (score >= 75) {
      variant = "success";
      label = "Good";
      color = "text-[#5c8d6a]";
      bgColor = "bg-[#e8f4ea]";
    } else if (score >= 60) {
      variant = "warning";
      label = "Moderate";
      color = "text-[#cd8539]";
      bgColor = "bg-[#fff0dd]";
    } else if (score >= 40) {
      variant = "warning";
      label = "Fair";
      color = "text-[#cd8539]";
      bgColor = "bg-[#fff0dd]";
    } else if (score >= 0) {
      variant = "destructive";
      label = "Poor";
      color = "text-[#e05d5d]";
      bgColor = "bg-[#fde8e8]";
    }

    return <Badge className={`${bgColor} ${color} border-0`}>{label}</Badge>;
  };

  const getTraitCompatibilityIcon = (score) => {
    if (score >= 75) {
      return <CheckCircle className="h-4 w-4 text-[#5c8d6a]" />;
    } else if (score >= 50) {
      return <Info className="h-4 w-4 text-[#cd8539]" />;
    } else {
      return <XCircle className="h-4 w-4 text-[#e05d5d]" />;
    }
  };

  const getTraitIcon = (traitName) => {
    switch (traitName.toLowerCase()) {
      case "egg production":
        return <Egg className="h-4 w-4 text-[#fcba6d]" />;
      case "meat production":
        return <Scale className="h-4 w-4 text-[#cd8539]" />;
      case "climate adaptability":
        return <Thermometer className="h-4 w-4 text-[#e05d5d]" />;
      case "health robustness":
        return <Heart className="h-4 w-4 text-[#5c8d6a]" />;
      case "temperament":
        return <Feather className="h-4 w-4 text-[#9c6dd4]" />;
      case "hybrid vigor":
        return <Zap className="h-4 w-4 text-[#fcba6d]" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderTraitComparison = () => {
    if (!breed1Details || !breed2Details) return null;

    const traits = [
      "eggProduction",
      "meatProduction",
      "climateAdaptability",
      "healthRobustness",
      "temperament",
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {traits.map((trait) => {
          const traitName = trait
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase());
          const breed1Value = breed1Details[trait] || 0;
          const breed2Value = breed2Details[trait] || 0;
          const difference = Math.abs(breed1Value - breed2Value);
          const compatibility = 100 - difference * 10;

          return (
            <Card key={trait} className="border-[#ffecd4] overflow-hidden">
              <CardHeader className="bg-[#fff8ef]/30 py-3 px-4 border-b border-[#ffecd4]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTraitIcon(traitName)}
                    <h4 className="text-sm font-medium text-[#8d6b48]">
                      {traitName}
                    </h4>
                  </div>
                  {getTraitCompatibilityIcon(compatibility)}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div>
                    <p className="text-gray-500">Breed 1</p>
                    <p className="font-medium">{breed1Value}/10</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Breed 2</p>
                    <p className="font-medium">{breed2Value}/10</p>
                  </div>
                </div>
                <Progress value={compatibility} className="h-2 bg-[#ffecd4]" />
                <p className="text-xs text-gray-500 mt-2">
                  {compatibility >= 75
                    ? "Highly compatible"
                    : compatibility >= 50
                    ? "Moderately compatible"
                    : "Low compatibility"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderCompatibilityDetails = () => {
    if (!compatibilityResult) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-[#ffecd4] p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-[#8d6b48]">
              Overall Compatibility
            </h3>
            {getCompatibilityBadge(compatibilityResult.overallScore)}
          </div>
          <Progress
            value={compatibilityResult.overallScore}
            className="h-3 bg-[#ffecd4]"
          />
          <p className="text-sm text-gray-500 mt-3">
            {compatibilityResult.overallSummary}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#ffecd4] p-4 space-y-4">
          <h3 className="text-lg font-medium text-[#8d6b48] flex items-center gap-2">
            <Award className="h-5 w-5 text-[#fcba6d]" />
            Key Factors
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {compatibilityResult.keyFactors.map((factor, index) => (
              <div
                key={index}
                className="border border-[#ffecd4] bg-[#fff8ef]/30 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  {getTraitIcon(factor.name)}
                  <span className="font-medium text-[#8d6b48]">
                    {factor.name}
                  </span>
                  {getCompatibilityBadge(factor.score)}
                </div>
                <p className="text-sm text-gray-500">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#ffecd4] p-4 space-y-4">
          <h3 className="text-lg font-medium text-[#8d6b48] flex items-center gap-2">
            <Dna className="h-5 w-5 text-[#fcba6d]" />
            Trait Comparison
          </h3>
          {renderTraitComparison()}
        </div>
      </div>
    );
  };

  const renderGeneticAnalysis = () => {
    if (!compatibilityResult) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-[#ffecd4] p-4 space-y-4">
          <h3 className="text-lg font-medium text-[#8d6b48] flex items-center gap-2">
            <Dna className="h-5 w-5 text-[#fcba6d]" />
            Genetic Compatibility
          </h3>
          <p className="text-sm text-gray-500">
            {compatibilityResult.geneticAnalysis.summary}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <div className="border border-[#ffecd4] bg-[#fff8ef]/30 rounded-lg p-4">
              <h4 className="font-medium text-[#8d6b48] mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#fcba6d]" />
                Hybrid Vigor
              </h4>
              <Progress
                value={compatibilityResult.geneticAnalysis.hybridVigor}
                className="h-2 bg-[#ffecd4]"
              />
              <p className="text-xs text-gray-500 mt-2">
                {compatibilityResult.geneticAnalysis.hybridVigorNotes}
              </p>
            </div>

            <div className="border border-[#ffecd4] bg-[#fff8ef]/30 rounded-lg p-4">
              <h4 className="font-medium text-[#8d6b48] mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[#fcba6d]" />
                Genetic Risks
              </h4>
              <div className="space-y-2">
                {compatibilityResult.geneticAnalysis.geneticRisks.map(
                  (risk, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-[#e05d5d] mt-0.5" />
                      <p className="text-sm text-gray-500">{risk}</p>
                    </div>
                  )
                )}
                {compatibilityResult.geneticAnalysis.geneticRisks.length ===
                  0 && (
                  <p className="text-sm text-gray-500">
                    No significant genetic risks identified.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#ffecd4] p-4 space-y-4">
          <h3 className="text-lg font-medium text-[#8d6b48] flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#fcba6d]" />
            Trait Inheritance
          </h3>

          <div className="space-y-4">
            {compatibilityResult.geneticAnalysis.traitInheritance.map(
              (trait, index) => (
                <div
                  key={index}
                  className="border-b border-[#ffecd4] pb-3 last:border-0"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-[#8d6b48] flex items-center gap-2">
                      {getTraitIcon(trait.name)}
                      {trait.name}
                    </h4>
                    <Badge className="bg-[#fff8ef] text-[#cd8539] border-[#ffecd4]">
                      {trait.inheritancePattern}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{trait.description}</p>

                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                    <div className="bg-[#fff8ef]/50 p-2 rounded border border-[#ffecd4]">
                      <p className="text-gray-500">Dominant</p>
                      <p className="font-medium">{trait.dominantPercentage}%</p>
                    </div>
                    <div className="bg-[#fff8ef]/50 p-2 rounded border border-[#ffecd4]">
                      <p className="text-gray-500">Mixed</p>
                      <p className="font-medium">{trait.mixedPercentage}%</p>
                    </div>
                    <div className="bg-[#fff8ef]/50 p-2 rounded border border-[#ffecd4]">
                      <p className="text-gray-500">Recessive</p>
                      <p className="font-medium">
                        {trait.recessivePercentage}%
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderBreedingGoals = () => {
    if (!compatibilityResult) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-[#ffecd4] p-4 space-y-4">
          <h3 className="text-lg font-medium text-[#8d6b48] flex items-center gap-2">
            <Award className="h-5 w-5 text-[#fcba6d]" />
            Breeding Recommendations
          </h3>

          <div className="space-y-3">
            {compatibilityResult.recommendations.map(
              (recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 border-b border-[#ffecd4] pb-3 last:border-0"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#fff8ef] text-[#cd8539] mt-0.5">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-[#8d6b48]">
                      {recommendation.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {recommendation.description}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#ffecd4] p-4 space-y-4">
          <h3 className="text-lg font-medium text-[#8d6b48] flex items-center gap-2">
            <PieChart className="h-5 w-5 text-[#fcba6d]" />
            Expected Outcomes
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {compatibilityResult.expectedOutcomes.map((outcome, index) => (
              <div
                key={index}
                className="border border-[#ffecd4] bg-[#fff8ef]/30 rounded-lg p-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-[#8d6b48]">
                    {outcome.trait}
                  </h4>
                  <Badge className="bg-white text-[#cd8539] border-[#ffecd4]">
                    {outcome.probability}%
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">{outcome.description}</p>
              </div>
            ))}
          </div>
        </div>

        {breedingGoal && (
          <div className="bg-white rounded-xl border border-[#ffecd4] p-4 space-y-4">
            <h3 className="text-lg font-medium text-[#8d6b48] flex items-center gap-2">
              <Target className="h-5 w-5 text-[#fcba6d]" />
              Goal Alignment
            </h3>

            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-[#fff8ef] flex items-center justify-center relative">
                <div
                  className="absolute inset-0 rounded-full border-4 border-[#cd8539]"
                  style={{
                    clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 ${
                      100 - compatibilityResult.goalAlignment.score
                    }%)`,
                  }}
                ></div>
                <span className="text-2xl font-bold text-[#cd8539]">
                  {compatibilityResult.goalAlignment.score}%
                </span>
              </div>

              <div className="flex-1">
                <h4 className="font-medium text-[#8d6b48] mb-1">
                  Alignment with {breedingGoal}
                </h4>
                <p className="text-sm text-gray-500">
                  {compatibilityResult.goalAlignment.analysis}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const exportCompatibilityReport = () => {
    if (!compatibilityResult) return;

    // Create report content
    const reportContent = {
      title: `Breeding Compatibility Report: ${breed1} × ${breed2}`,
      date: new Date().toLocaleDateString(),
      overallScore: compatibilityResult.overallScore,
      summary: compatibilityResult.overallSummary,
      keyFactors: compatibilityResult.keyFactors,
      geneticAnalysis: compatibilityResult.geneticAnalysis,
      recommendations: compatibilityResult.recommendations,
      expectedOutcomes: compatibilityResult.expectedOutcomes,
    };

    // Convert to JSON string
    const reportJson = JSON.stringify(reportContent, null, 2);

    // Create blob and download
    const blob = new Blob([reportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compatibility_report_${breed1}_${breed2}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Report exported successfully");
  };

  const printCompatibilityReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl border border-[#ffecd4] bg-white">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-[#fff8ef] to-[#ffecd4] opacity-50 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-tr from-[#fff8ef] to-[#ffecd4] opacity-50 blur-3xl"></div>

        <div className="relative p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#8d6b48] flex items-center gap-2">
                <Heart className="h-6 w-6 text-[#e05d5d]" />
                Breed Compatibility Assistant
              </h2>
              <p className="text-[#cd8539]">
                Analyze genetic compatibility and breeding outcomes
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={breedingGoal}
                onValueChange={(value) => setBreedingGoal(value || "")}
              >
                <SelectTrigger className="w-full sm:w-[200px] border-[#ffecd4]">
                  <SelectValue placeholder="Select breeding goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-specific-goal">
                    No specific goal
                  </SelectItem>
                  <SelectItem value="egg production">Egg Production</SelectItem>
                  <SelectItem value="meat quality">Meat Quality</SelectItem>
                  <SelectItem value="dual purpose">Dual Purpose</SelectItem>
                  <SelectItem value="show quality">Show Quality</SelectItem>
                  <SelectItem value="climate adaptation">
                    Climate Adaptation
                  </SelectItem>
                  <SelectItem value="disease resistance">
                    Disease Resistance
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card className="border-[#ffecd4] overflow-hidden">
            <CardHeader className="bg-[#fff8ef]/50 border-b border-[#ffecd4]">
              <CardTitle className="text-[#8d6b48]">Select Breeds</CardTitle>
              <CardDescription>
                Choose two breeds to analyze compatibility
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="breed1" className="text-[#8d6b48]">
                  Breed 1
                </Label>
                <Select
                  value={breed1}
                  onValueChange={(value) => setBreed1(value || "")}
                >
                  <SelectTrigger id="breed1" className="border-[#ffecd4]">
                    <SelectValue placeholder="Select first breed" />
                  </SelectTrigger>
                  <SelectContent>
                    {pureBreeds.map((breed, index) => (
                      <SelectItem
                        key={`breed1-${index}-${breed.id || breed}`}
                        value={breed.name || breed}
                      >
                        {breed.name || breed}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="breed2" className="text-[#8d6b48]">
                  Breed 2
                </Label>
                <Select
                  value={breed2}
                  onValueChange={(value) => setBreed2(value || "")}
                >
                  <SelectTrigger id="breed2" className="border-[#ffecd4]">
                    <SelectValue placeholder="Select second breed" />
                  </SelectTrigger>
                  <SelectContent>
                    {pureBreeds.map((breed, index) => (
                      <SelectItem
                        key={`breed2-${index}-${breed.id || breed}`}
                        value={breed.name || breed}
                      >
                        {breed.name || breed}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {breed1 && breed1Details && (
                <div className="mt-4 p-3 bg-[#fff8ef]/50 rounded-lg border border-[#ffecd4]">
                  <h4 className="font-medium text-[#8d6b48] mb-2">{breed1}</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Egg Production:</span>
                      <span>{breed1Details.eggProduction}/10</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Meat Production:</span>
                      <span>{breed1Details.meatProduction}/10</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        Climate Adaptability:
                      </span>
                      <span>{breed1Details.climateAdaptability}/10</span>
                    </div>
                  </div>
                </div>
              )}

              {breed2 && breed2Details && (
                <div className="mt-4 p-3 bg-[#fff8ef]/50 rounded-lg border border-[#ffecd4]">
                  <h4 className="font-medium text-[#8d6b48] mb-2">{breed2}</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Egg Production:</span>
                      <span>{breed2Details.eggProduction}/10</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Meat Production:</span>
                      <span>{breed2Details.meatProduction}/10</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        Climate Adaptability:
                      </span>
                      <span>{breed2Details.climateAdaptability}/10</span>
                    </div>
                  </div>
                </div>
              )}

              {breed1 && breed2 && (
                <div className="pt-4">
                  <Button
                    className="w-full bg-[#cd8539] hover:bg-[#b97431] text-white"
                    onClick={calculateCompatibility}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Recalculate Compatibility
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {compatibilityResult && (
            <Card className="border-[#ffecd4] overflow-hidden">
              <CardHeader className="bg-[#fff8ef]/50 border-b border-[#ffecd4] py-3">
                <CardTitle className="text-[#8d6b48] text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Textarea
                  placeholder="Add your breeding notes here..."
                  className="min-h-[120px] border-[#ffecd4]"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                />
                <div className="flex justify-end mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-[#ffecd4] text-[#cd8539] hover:bg-[#fff8ef]"
                    onClick={() => {
                      navigator.clipboard.writeText(customNotes);
                      toast.success("Notes copied to clipboard");
                    }}
                  >
                    <Clipboard className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-2">
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
            <Card className="border-[#ffecd4] overflow-hidden">
              <CardContent className="flex justify-center items-center h-[400px]">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#fff8ef] mb-4">
                    <Bird className="h-8 w-8 text-[#fcba6d]" />
                  </div>
                  <p className="text-[#8d6b48] font-medium">
                    Select two breeds to analyze compatibility
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
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
                      variant="outline"
                      size="sm"
                      className="border-[#ffecd4] text-[#cd8539] hover:bg-[#fff8ef]"
                      onClick={printCompatibilityReport}
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Print
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 bg-[#fff8ef]/70 border border-[#ffecd4] p-1 rounded-lg">
                    <TabsTrigger
                      value="overview"
                      className="data-[state=active]:bg-white data-[state=active]:text-[#cd8539] data-[state=active]:shadow-sm rounded-md"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="genetic"
                      className="data-[state=active]:bg-white data-[state=active]:text-[#cd8539] data-[state=active]:shadow-sm rounded-md"
                    >
                      Genetic Analysis
                    </TabsTrigger>
                    <TabsTrigger
                      value="goals"
                      className="data-[state=active]:bg-white data-[state=active]:text-[#cd8539] data-[state=active]:shadow-sm rounded-md"
                    >
                      Breeding Goals
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6 pt-6">
                    {renderCompatibilityDetails()}
                  </TabsContent>

                  <TabsContent value="genetic" className="space-y-6 pt-6">
                    {renderGeneticAnalysis()}
                  </TabsContent>

                  <TabsContent value="goals" className="space-y-6 pt-6">
                    {renderBreedingGoals()}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BreedCompatibilityAssistant;

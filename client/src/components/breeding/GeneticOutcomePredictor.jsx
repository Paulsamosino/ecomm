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
  Dna,
  Egg,
  Scale,
  Heart,
  Feather,
  Thermometer,
  BarChart3,
  PieChart,
  Download,
  ChevronRight,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Bird,
  Calculator,
  Zap,
  Sun,
  CloudRain,
  Leaf,
  Award,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

// Farm-themed color palette
const COLORS = ["#fcba6d", "#cd8539", "#8fbc8f", "#e8f4ea", "#ffecd4"];
const CHART_COLORS = {
  primary: "#fcba6d",
  secondary: "#cd8539",
  tertiary: "#8fbc8f",
  light: "#ffecd4",
  success: "#4BC0C0",
  warning: "#FF9F40",
  error: "#FF6384",
  neutral: "#9966FF",
};

const GeneticOutcomePredictor = () => {
  const [breed1, setBreed1] = useState("");
  const [breed2, setBreed2] = useState("");
  const [pureBreeds, setPureBreeds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [activeTab, setActiveTab] = useState("traits");
  const [simulationCount, setSimulationCount] = useState(100);
  const [selectedGeneration, setSelectedGeneration] = useState(1);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  useEffect(() => {
    loadBreeds();
  }, []);

  useEffect(() => {
    if (breed1 && breed2) {
      predictOutcomes();
    } else {
      setPredictionResult(null);
    }
  }, [breed1, breed2, simulationCount, selectedGeneration]);

  const loadBreeds = async () => {
    try {
      const breeds = await breedingService.getBreeds();
      // Make sure we're handling breeds in a consistent format
      const formattedBreeds = breeds.map((breed) =>
        typeof breed === "string" ? { name: breed } : breed
      );
      setPureBreeds(formattedBreeds);
    } catch (error) {
      console.error("Failed to load breeds:", error);
      toast.error("Failed to load breeds");
    }
  };

  const predictOutcomes = async () => {
    if (!breed1 || !breed2) return;

    setIsLoading(true);
    try {
      const result = await breedingService.predictGeneticOutcomes(
        breed1,
        breed2,
        {
          simulationCount,
          generations: selectedGeneration,
        }
      );
      setPredictionResult(result);
    } catch (error) {
      console.error("Failed to predict genetic outcomes:", error);
      toast.error("Failed to predict genetic outcomes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSimulation = () => {
    if (breed1 && breed2) {
      predictOutcomes();
      toast.success("Simulation started!");
    } else {
      toast.error("Please select both parent breeds");
    }
  };

  const getTraitIcon = (traitName) => {
    switch (traitName.toLowerCase()) {
      case "egg production":
        return <Egg className="h-4 w-4 text-[#fcba6d]" />;
      case "meat production":
        return <Scale className="h-4 w-4 text-[#cd8539]" />;
      case "climate adaptability":
        return <Thermometer className="h-4 w-4 text-[#cd8539]" />;
      case "health robustness":
        return <Heart className="h-4 w-4 text-[#8fbc8f]" />;
      case "temperament":
        return <Feather className="h-4 w-4 text-[#fcba6d]" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTraitVariabilityBadge = (variability) => {
    if (variability < 10) {
      return (
        <Badge
          variant="outline"
          className="ml-2 bg-green-50 text-green-600 border-green-100"
        >
          Low Variability
        </Badge>
      );
    } else if (variability < 20) {
      return (
        <Badge
          variant="outline"
          className="ml-2 bg-amber-50 text-amber-600 border-amber-100"
        >
          Moderate Variability
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="outline"
          className="ml-2 bg-red-50 text-red-600 border-red-100"
        >
          High Variability
        </Badge>
      );
    }
  };

  const renderTraitPredictions = () => {
    if (!predictionResult) return null;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-3">Expected Trait Distributions</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Based on {simulationCount} simulated offspring in generation{" "}
            {selectedGeneration}
          </p>

          <div className="space-y-6">
            {Object.entries(predictionResult.traitDistributions).map(
              ([trait, distribution]) => (
                <div key={trait} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getTraitIcon(trait)}
                      <span className="ml-2 font-medium">{trait}</span>
                      {getTraitVariabilityBadge(distribution.variability)}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Average: </span>
                      <span className="font-medium">
                        {distribution.average}%
                      </span>
                    </div>
                  </div>

                  <div className="h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={distribution.ranges}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="percentage"
                          name="Offspring %"
                          fill="#4BC0C0"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>
                        Range: {distribution.min}% - {distribution.max}%
                      </span>
                      <span>
                        Standard Deviation:{" "}
                        {distribution.standardDeviation.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <Separator className="my-2" />
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPhenotypePredictions = () => {
    if (!predictionResult || !predictionResult.phenotypeDistribution)
      return null;

    const { phenotypeDistribution } = predictionResult;

    // Convert to format for pie chart
    const pieData = Object.entries(phenotypeDistribution).map(
      ([phenotype, percentage]) => ({
        name: phenotype,
        value: percentage,
      })
    );

    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-3">Expected Phenotype Distribution</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Visual characteristics distribution in generation{" "}
            {selectedGeneration}
          </p>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-medium mb-3">Phenotype Details</h3>
          <div className="space-y-3">
            {predictionResult.phenotypeDetails.map((detail, index) => (
              <div key={index} className="flex items-start gap-2">
                <div
                  className="w-4 h-4 mt-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <div>
                  <div className="font-medium text-sm">{detail.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {detail.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderGeneticAnalysis = () => {
    if (!predictionResult || !predictionResult.geneticAnalysis) return null;

    const { geneticAnalysis } = predictionResult;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-3">Genetic Inheritance Patterns</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Analysis of gene inheritance across {simulationCount} simulations
          </p>

          <div className="space-y-4">
            {geneticAnalysis.inheritancePatterns.map((pattern, index) => (
              <div key={index} className="flex items-start gap-2">
                <Dna className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <div className="font-medium text-sm">{pattern.trait}</div>
                  <div className="text-sm text-muted-foreground">
                    {pattern.description}
                  </div>
                  <div className="mt-2 flex items-center">
                    <Progress
                      value={pattern.inheritanceRate}
                      className="h-2 w-24 mr-2"
                    />
                    <span className="text-sm">
                      {pattern.inheritanceRate}% inheritance rate
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-medium mb-3">Genetic Diversity</h3>
          <div className="flex items-center mb-4">
            <Progress
              value={geneticAnalysis.geneticDiversity}
              className="h-2 w-full mr-2"
            />
            <span className="text-sm font-medium">
              {geneticAnalysis.geneticDiversity}%
            </span>
          </div>
          <p className="text-sm">{geneticAnalysis.diversityNotes}</p>
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
                        Occurrence Rate: {risk.occurrenceRate}%
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

  const renderGenerationalTrends = () => {
    if (!predictionResult || !predictionResult.generationalTrends) return null;

    const { generationalTrends } = predictionResult;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-3">Trait Evolution Over Generations</h3>
          <p className="text-sm text-muted-foreground mb-4">
            How traits change across multiple generations
          </p>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={generationalTrends.traitEvolution}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="generation" />
                <YAxis />
                <Tooltip />
                <Legend />
                {generationalTrends.traitNames.map((trait, index) => (
                  <Line
                    key={trait}
                    type="monotone"
                    dataKey={trait}
                    stroke={COLORS[index % COLORS.length]}
                    activeDot={{ r: 8 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-medium mb-3">Stabilization Analysis</h3>
          <p className="text-sm mb-4">
            {generationalTrends.stabilizationAnalysis.summary}
          </p>

          <div className="space-y-3">
            {generationalTrends.stabilizationAnalysis.traitStabilization.map(
              (trait, index) => (
                <div key={index} className="flex items-start gap-2">
                  {getTraitIcon(trait.name)}
                  <div>
                    <div className="font-medium text-sm">{trait.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Stabilizes around generation{" "}
                      {trait.stabilizationGeneration}
                    </div>
                    <div className="mt-1 flex items-center">
                      <Progress
                        value={trait.stabilityScore}
                        className="h-2 w-24 mr-2"
                      />
                      <span className="text-sm">
                        Stability: {trait.stabilityScore}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-medium mb-3">Breeding Recommendations</h3>
          <ul className="space-y-2 text-sm">
            {generationalTrends.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const exportPredictionReport = () => {
    if (!predictionResult) return;

    // Create a report object
    const report = {
      date: new Date().toISOString(),
      breeds: {
        breed1,
        breed2,
      },
      simulationParameters: {
        simulationCount,
        generations: selectedGeneration,
      },
      predictionResults: predictionResult,
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(report, null, 2);

    // Create a blob and download link
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${breed1}-${breed2}-genetic-prediction.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Prediction report exported successfully");
  };

  return (
    <div className="space-y-8">
      {/* Header with animated background */}
      <div className="relative bg-white rounded-xl border border-[#ffecd4] p-6 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#fcba6d]/5 rounded-full blur-[80px] animate-pulse-slow" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#e8f4ea]/10 rounded-full blur-[100px] animate-pulse-slow" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#fff0dd] text-[#cd8539] text-xs font-medium mb-3 shadow-sm">
              <Dna className="h-3 w-3 mr-1" />
              <span>Advanced Genetics</span>
            </div>
            <h2 className="text-2xl font-bold text-[#cd8539]">
              Genetic Outcome Predictor
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Simulate breeding outcomes with advanced genetic modeling
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-[#ffecd4] bg-[#fff0dd] text-[#cd8539] hover:bg-[#ffecd4]"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          >
            <Feather className="h-4 w-4 mr-2" />
            {showAdvancedOptions ? "Hide" : "Show"} Advanced Options
          </Button>
        </div>
      </div>

      <Card className="border-[#ffecd4] overflow-hidden">
        <CardHeader className="bg-[#fff8ef]/50 border-b border-[#ffecd4]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[#cd8539] flex items-center gap-2">
                <Bird className="h-5 w-5 text-[#fcba6d]" />
                Predict Breeding Outcomes
              </CardTitle>
              <CardDescription className="text-gray-500">
                Select two breeds to predict genetic outcomes across generations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label
                htmlFor="breed1"
                className="text-[#cd8539] flex items-center gap-2"
              >
                <Bird className="h-4 w-4 text-[#fcba6d]" />
                Parent Breed 1
              </Label>
              <Select
                value={breed1}
                onValueChange={(value) => setBreed1(value || "")}
              >
                <SelectTrigger id="breed1" className="mt-1 border-[#ffecd4]">
                  <SelectValue placeholder="Select breed" />
                </SelectTrigger>
                <SelectContent>
                  {pureBreeds.map((breed, index) => (
                    <SelectItem
                      key={`breed-${index}-${
                        typeof breed === "string"
                          ? breed
                          : breed.id || breed.name || index
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
            </div>

            <div>
              <Label
                htmlFor="breed2"
                className="text-[#cd8539] flex items-center gap-2"
              >
                <Bird className="h-4 w-4 text-[#fcba6d]" />
                Parent Breed 2
              </Label>
              <Select
                value={breed2}
                onValueChange={(value) => setBreed2(value || "")}
              >
                <SelectTrigger id="breed2" className="mt-1 border-[#ffecd4]">
                  <SelectValue placeholder="Select breed" />
                </SelectTrigger>
                <SelectContent>
                  {pureBreeds.map((breed, index) => (
                    <SelectItem
                      key={`breed-${index}-${
                        typeof breed === "string"
                          ? breed
                          : breed.id || breed.name || index
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
            </div>
          </div>

          {showAdvancedOptions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 p-4 bg-[#fff8ef]/50 border border-[#ffecd4] rounded-lg">
              <div>
                <Label
                  htmlFor="simulationCount"
                  className="text-[#cd8539] flex items-center gap-2"
                >
                  <Calculator className="h-4 w-4 text-[#fcba6d]" />
                  Simulation Count
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="simulationCount"
                    type="number"
                    min="10"
                    max="1000"
                    value={simulationCount}
                    onChange={(e) =>
                      setSimulationCount(parseInt(e.target.value) || 100)
                    }
                    className="border-[#ffecd4]"
                  />
                  <Badge
                    variant="outline"
                    className="bg-[#fff0dd] text-[#cd8539] border-[#ffecd4]"
                  >
                    offspring
                  </Badge>
                </div>
              </div>

              <div>
                <Label
                  htmlFor="generation"
                  className="text-[#cd8539] flex items-center gap-2"
                >
                  <Zap className="h-4 w-4 text-[#fcba6d]" />
                  Generation
                </Label>
                <div className="mt-1 flex items-center">
                  <Input
                    id="generation"
                    type="number"
                    min="1"
                    max="5"
                    value={selectedGeneration}
                    onChange={(e) =>
                      setSelectedGeneration(parseInt(e.target.value) || 1)
                    }
                    className="border-[#ffecd4]"
                  />
                  <Badge
                    variant="outline"
                    className="bg-[#fff0dd] text-[#cd8539] border-[#ffecd4]"
                  >
                    F{selectedGeneration}
                  </Badge>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 mt-4 pt-3 border-t border-[#ffecd4]">
                <Button
                  className="w-full"
                  onClick={handleRunSimulation}
                  disabled={!breed1 || !breed2 || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Simulation...
                    </>
                  ) : (
                    <>
                      <Dna className="mr-2 h-4 w-4" />
                      Run Simulation
                    </>
                  )}
                </Button>
              </div>

              <div className="col-span-1 md:col-span-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportPredictionReport}
                  disabled={!predictionResult}
                  className="flex items-center gap-2 w-full"
                >
                  <Download className="h-4 w-4" />
                  Export Prediction Report
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col justify-center items-center h-[400px]">
            <Loader2 className="h-12 w-12 text-[#cd8539] animate-spin mb-4" />
            <p className="text-[#8d6b48] font-medium">
              Running genetic simulations...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This may take a moment while we process the simulations
            </p>
          </CardContent>
        </Card>
      ) : !breed1 || !breed2 ? (
        <Card>
          <CardContent className="flex flex-col justify-center items-center h-[400px] text-center">
            <Dna className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Select Breeds to Predict
            </h3>
            <p className="text-muted-foreground max-w-md">
              Choose two breeds to simulate genetic outcomes and predict
              offspring traits across generations
            </p>
          </CardContent>
        </Card>
      ) : !predictionResult ? (
        <Card>
          <CardContent className="flex flex-col justify-center items-center h-[400px] text-center">
            <Dna className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Ready to Run Simulation
            </h3>
            <p className="text-muted-foreground max-w-md mb-4">
              Selected breeds: {breed1} and {breed2}
            </p>
            <Button onClick={handleRunSimulation}>
              <Dna className="mr-2 h-4 w-4" />
              Run Genetic Simulation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>
                  {breed1} × {breed2} Genetic Prediction
                </CardTitle>
                <CardDescription>
                  Based on {simulationCount} simulated offspring through{" "}
                  {selectedGeneration} generation
                  {selectedGeneration > 1 ? "s" : ""}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value || "traits")}
              className="space-y-4"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="traits">Traits</TabsTrigger>
                <TabsTrigger value="phenotypes">Phenotypes</TabsTrigger>
                <TabsTrigger value="genetics">Genetics</TabsTrigger>
                <TabsTrigger value="generations">Generations</TabsTrigger>
              </TabsList>

              <TabsContent value="traits" className="space-y-4">
                {renderTraitPredictions()}
              </TabsContent>

              <TabsContent value="phenotypes" className="space-y-4">
                {renderPhenotypePredictions()}
              </TabsContent>

              <TabsContent value="genetics" className="space-y-4">
                {renderGeneticAnalysis()}
              </TabsContent>

              <TabsContent value="generations" className="space-y-4">
                {renderGenerationalTrends()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Genetic Prediction</CardTitle>
          <CardDescription>
            Understanding how the genetic predictor works
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>
                How does the genetic prediction work?
              </AccordionTrigger>
              <AccordionContent>
                Our genetic prediction system uses a combination of Mendelian
                genetics, quantitative genetics models, and historical breeding
                data to simulate potential offspring. It runs multiple
                simulations (the number you select) to account for the random
                nature of genetic inheritance and provides statistical
                distributions of expected outcomes rather than single values.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>
                What's the difference between generations?
              </AccordionTrigger>
              <AccordionContent>
                F1 (first generation) shows the direct offspring of your
                selected breeds. Higher generations (F2, F3, etc.) show what
                happens when those offspring are bred together. Later
                generations often show trait stabilization and can reveal
                recessive traits that weren't visible in F1. This is
                particularly important for long-term breeding programs.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>
                How accurate are these predictions?
              </AccordionTrigger>
              <AccordionContent>
                While our predictions are based on established genetic
                principles and extensive breeding data, they represent
                statistical probabilities rather than guarantees. Real-world
                results can vary due to environmental factors, epigenetics, and
                the unique genetic makeup of individual animals. The predictions
                are most accurate for well-documented breeds with consistent
                genetic traits.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>
                What do the variability indicators mean?
              </AccordionTrigger>
              <AccordionContent>
                Variability indicators show how consistent a trait is likely to
                be across offspring. Low variability means most offspring will
                have similar values for that trait. High variability means there
                will be significant differences between offspring. High
                variability can be beneficial if you're selecting for specific
                traits, as it gives you more diverse options to choose from.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>
                How can I use this for my breeding program?
              </AccordionTrigger>
              <AccordionContent>
                Use these predictions to: 1) Evaluate potential breeding pairs
                before making actual breeding decisions, 2) Understand which
                traits are likely to be consistent vs. variable in offspring, 3)
                Plan multi-generation breeding strategies by seeing how traits
                evolve over generations, 4) Identify potential genetic risks or
                issues before they appear, and 5) Set realistic expectations for
                breeding outcomes.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneticOutcomePredictor;

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
  const [predictionResult, setPredictionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pureBreeds, setPureBreeds] = useState([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [simulationCount, setSimulationCount] = useState(100);
  const [selectedGeneration, setSelectedGeneration] = useState(3);
  const [activeTab, setActiveTab] = useState("traits");

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
        typeof breed === "string" ? { id: breed, name: breed } : breed
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

  if (isLoading && !predictionResult) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-lg border border-[#ffecd4] p-6">
        <div className="flex flex-col items-center">
          <Dna className="h-8 w-8 text-[#fcba6d] animate-pulse mb-2" />
          <p className="text-[#cd8539]">Simulating genetic outcomes...</p>
        </div>
      </div>
    );
  }

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
                      key={`breed1-${index}-${breed.id || breed}`}
                      value={breed.name || breed}
                    >
                      {breed.name || breed}
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
                      key={`breed2-${index}-${breed.id || breed}`}
                      value={breed.name || breed}
                    >
                      {breed.name || breed}
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
                      setSimulationCount(parseInt(e.target.value))
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
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="generation"
                    type="number"
                    min="1"
                    max="5"
                    value={selectedGeneration}
                    onChange={(e) =>
                      setSelectedGeneration(parseInt(e.target.value))
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
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleRunSimulation}
              className="bg-[#fcba6d] hover:bg-[#cd8539] text-white"
              disabled={isLoading || !breed1 || !breed2}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Dna className="mr-2 h-4 w-4" />
                  Run Genetic Simulation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {predictionResult && (
        <div className="space-y-6">
          <Card className="border-[#ffecd4] overflow-hidden">
            <CardHeader className="bg-[#fff8ef]/50 border-b border-[#ffecd4]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#cd8539] flex items-center gap-2">
                    <Dna className="h-5 w-5 text-[#fcba6d]" />
                    Genetic Prediction Results
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Predicted outcomes for{" "}
                    {predictionResult.parentBreeds.breed1} ×{" "}
                    {predictionResult.parentBreeds.breed2}
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="bg-[#fff0dd] text-[#cd8539] border-[#ffecd4]"
                >
                  Generation F{selectedGeneration}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs
                defaultValue={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
              >
                <TabsList className="bg-[#fff8ef]/70 border border-[#ffecd4] p-1 rounded-lg">
                  <TabsTrigger
                    value="traits"
                    className="data-[state=active]:bg-white data-[state=active]:text-[#cd8539] data-[state=active]:shadow-sm flex items-center gap-2 rounded-md"
                  >
                    <Feather className="h-4 w-4" />
                    Traits
                  </TabsTrigger>
                  <TabsTrigger
                    value="compatibility"
                    className="data-[state=active]:bg-white data-[state=active]:text-[#cd8539] data-[state=active]:shadow-sm flex items-center gap-2 rounded-md"
                  >
                    <Heart className="h-4 w-4" />
                    Compatibility
                  </TabsTrigger>
                  <TabsTrigger
                    value="statistics"
                    className="data-[state=active]:bg-white data-[state=active]:text-[#cd8539] data-[state=active]:shadow-sm flex items-center gap-2 rounded-md"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Statistics
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="traits" className="space-y-6">
                  <div className="space-y-6">
                    <h3 className="font-medium text-[#cd8539] flex items-center gap-2">
                      <Feather className="h-5 w-5 text-[#fcba6d]" />
                      Expected Trait Distributions
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Based on {simulationCount} simulated offspring in
                      generation {selectedGeneration}
                    </p>

                    <div className="space-y-6">
                      {Object.entries(predictionResult.traitDistributions).map(
                        ([trait, distribution]) => (
                          <div
                            key={trait}
                            className="space-y-3 p-4 border border-[#ffecd4] rounded-lg hover:bg-[#fff8ef]/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {getTraitIcon(trait)}
                                <span className="ml-2 font-medium text-[#cd8539]">
                                  {trait}
                                </span>
                                {getTraitVariabilityBadge(
                                  distribution.variability
                                )}
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-500">Average: </span>
                                <span className="font-medium text-[#cd8539]">
                                  {distribution.average}%
                                </span>
                              </div>
                            </div>

                            <div className="h-[150px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={distribution.ranges}
                                  margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                  }}
                                >
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#f5f5f5"
                                  />
                                  <XAxis
                                    dataKey="range"
                                    tick={{ fill: "#666" }}
                                    axisLine={{ stroke: "#eee" }}
                                    tickLine={{ stroke: "#eee" }}
                                  />
                                  <YAxis
                                    tick={{ fill: "#666" }}
                                    axisLine={{ stroke: "#eee" }}
                                    tickLine={{ stroke: "#eee" }}
                                  />
                                  <Tooltip />
                                  <Bar
                                    dataKey="percentage"
                                    name="Percentage"
                                    fill={CHART_COLORS.primary}
                                    radius={[4, 4, 0, 0]}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>

                            <div className="text-sm text-gray-500">
                              <div className="flex justify-between items-center">
                                <span>
                                  Parent 1:{" "}
                                  {predictionResult.parentTraits.breed1[trait]}%
                                </span>
                                <span>
                                  Parent 2:{" "}
                                  {predictionResult.parentTraits.breed2[trait]}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="compatibility" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border-[#ffecd4]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                          <Heart className="h-4 w-4 text-[#fcba6d]" />
                          Genetic Compatibility
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          <div className="text-3xl font-bold text-[#cd8539]">
                            {predictionResult.compatibility.score}%
                          </div>
                          <Badge
                            variant="outline"
                            className="ml-2 bg-green-50 text-green-600 border-green-100"
                          >
                            {predictionResult.compatibility.level}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {predictionResult.compatibility.description}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-[#ffecd4]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                          <Egg className="h-4 w-4 text-[#fcba6d]" />
                          Expected Fertility
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          <div className="text-3xl font-bold text-[#cd8539]">
                            {predictionResult.fertility.rate}%
                          </div>
                          <Badge
                            variant="outline"
                            className="ml-2 bg-amber-50 text-amber-600 border-amber-100"
                          >
                            {predictionResult.fertility.level}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {predictionResult.fertility.description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="pt-4">
                    <h3 className="font-medium text-[#cd8539] mb-4 flex items-center gap-2">
                      <Info className="h-5 w-5 text-[#fcba6d]" />
                      Compatibility Notes
                    </h3>

                    <div className="space-y-4">
                      {predictionResult.compatibility.notes.map(
                        (note, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 border border-[#ffecd4] rounded-lg hover:bg-[#fff8ef]/50 transition-colors"
                          >
                            {note.type === "positive" ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            ) : note.type === "negative" ? (
                              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                            ) : (
                              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                            )}
                            <div>
                              <h4 className="text-sm font-medium text-[#cd8539]">
                                {note.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {note.description}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="statistics" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="font-medium text-[#cd8539] mb-4 flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-[#fcba6d]" />
                        Trait Inheritance Distribution
                      </h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={predictionResult.inheritanceDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {predictionResult.inheritanceDistribution.map(
                                (entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                  />
                                )
                              )}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-[#cd8539] mb-4 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-[#fcba6d]" />
                        Trait Stability Over Generations
                      </h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={predictionResult.traitStability}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f5f5f5"
                            />
                            <XAxis
                              dataKey="generation"
                              tick={{ fill: "#666" }}
                              axisLine={{ stroke: "#eee" }}
                              tickLine={{ stroke: "#eee" }}
                            />
                            <YAxis
                              tick={{ fill: "#666" }}
                              axisLine={{ stroke: "#eee" }}
                              tickLine={{ stroke: "#eee" }}
                            />
                            <Tooltip />
                            <Legend />
                            <Bar
                              dataKey="stability"
                              name="Trait Stability"
                              fill={CHART_COLORS.primary}
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h3 className="font-medium text-[#cd8539] mb-4 flex items-center gap-2">
                      <Download className="h-5 w-5 text-[#fcba6d]" />
                      Export Options
                    </h3>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="border-[#ffecd4] text-[#cd8539] hover:bg-[#fff0dd]"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export as PDF
                      </Button>
                      <Button
                        variant="outline"
                        className="border-[#ffecd4] text-[#cd8539] hover:bg-[#fff0dd]"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export as CSV
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GeneticOutcomePredictor;

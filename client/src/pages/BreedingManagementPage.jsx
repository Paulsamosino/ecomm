import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  Info,
  Star,
  History,
  Calculator,
  Dna,
  LineChart,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  breedDatabase,
  breedCombinations,
  calculateHybridVigor,
} from "@/data/breedDatabase";

function calculateBreedingResult(breed1, breed2) {
  if (!breed1 || !breed2) return null;

  // Check for existing combinations in the database
  const combinationKey = `${breed1} × ${breed2}`;
  const reverseCombinationKey = `${breed2} × ${breed1}`;

  if (breedCombinations[combinationKey]) {
    return breedCombinations[combinationKey];
  } else if (breedCombinations[reverseCombinationKey]) {
    return breedCombinations[reverseCombinationKey];
  }

  // Generate predicted traits for new combinations
  const breed1Data = breedDatabase[breed1];
  const breed2Data = breedDatabase[breed2];

  if (!breed1Data || !breed2Data) {
    return {
      name: `${breed1}-${breed2} Cross`,
      characteristics: "Custom hybrid cross with unknown traits",
      expectedTraits: {
        eggProduction: "Variable",
        temperament: "Variable",
        meatQuality: "Variable",
        hybridVigor: "Unknown",
      },
      breedingConsiderations: [
        "Monitor offspring characteristics",
        "Keep detailed records",
      ],
    };
  }

  // Calculate predicted traits with improved accuracy
  const eggProd1 = parseInt(breed1Data.eggProduction?.split("-")[1]) || 0;
  const eggProd2 = parseInt(breed2Data.eggProduction?.split("-")[1]) || 0;
  const predictedEggProduction = Math.round(
    calculateHybridVigor(eggProd1, eggProd2)
  );

  return {
    name: `${breed1}-${breed2} Cross`,
    characteristics: "Custom hybrid with predicted traits",
    expectedTraits: {
      eggProduction: `${predictedEggProduction} eggs per year (estimated)`,
      eggColor: predictEggColor(breed1Data.eggColor, breed2Data.eggColor),
      temperament: `${breed1Data.temperament} × ${breed2Data.temperament}`,
      meatQuality: predictMeatQuality(breed1Data, breed2Data),
      maturityRate: "Moderate to Fast (Hybrid Vigor)",
      hybridVigor: "High",
      featherColor: `Variable - influenced by ${breed1} and ${breed2}`,
      purpose: combinePurpose(breed1Data.type, breed2Data.type),
      size: predictSize(breed1Data, breed2Data),
    },
    geneticPredictions: {
      dominantTraits: getDominantTraits(breed1Data, breed2Data),
      heterosisEffects: [
        "Enhanced growth rate",
        "Improved disease resistance",
        "Better adaptability",
        "Increased vigor",
      ],
    },
    breedingConsiderations: [
      `Climate adaptability: ${breed1Data.climate} × ${breed2Data.climate}`,
      `Broodiness tendency: ${breed1Data.broodiness || "Variable"} × ${
        breed2Data.broodiness || "Variable"
      }`,
      "Monitor first generation for trait expression",
      "Consider parent breed strengths",
      getSpecialConsiderations(breed1Data, breed2Data),
    ],
    parentBreeds: {
      breed1: {
        name: breed1,
        traits: breed1Data,
      },
      breed2: {
        name: breed2,
        traits: breed2Data,
      },
    },
  };
}

function predictEggColor(color1, color2) {
  if (!color1 || !color2) return "Variable";
  if (color1 === color2) return color1;
  return `Variable (${color1} to ${color2})`;
}

function predictMeatQuality(breed1, breed2) {
  const quality1 = breed1.characteristics?.toLowerCase().includes("meat")
    ? "Good"
    : "Average";
  const quality2 = breed2.characteristics?.toLowerCase().includes("meat")
    ? "Good"
    : "Average";
  if (quality1 === "Good" && quality2 === "Good") return "Excellent";
  if (quality1 === "Good" || quality2 === "Good") return "Good";
  return "Average";
}

function combinePurpose(type1, type2) {
  if (!type1 || !type2) return "Mixed Purpose";
  if (type1 === type2) return type1;
  if (type1 === "Dual Purpose" || type2 === "Dual Purpose")
    return "Dual Purpose";
  return "Mixed Purpose";
}

function predictSize(breed1, breed2) {
  const getWeightRange = (breed) => {
    if (!breed.weight) return null;
    const weights = breed.weight.match(/\d+(\.\d+)?/g);
    return weights ? weights.map(Number) : null;
  };

  const range1 = getWeightRange(breed1);
  const range2 = getWeightRange(breed2);

  if (!range1 || !range2) return "Variable";

  const avgMale = (range1[0] + range2[0]) / 2;
  const avgFemale = (range1[1] + range2[1]) / 2;

  return `Male: ~${avgMale.toFixed(1)} lbs, Female: ~${avgFemale.toFixed(
    1
  )} lbs`;
}

function getDominantTraits(breed1, breed2) {
  const traits = [];

  // Check genetic markers and traits
  if (breed1.geneticMarkers || breed2.geneticMarkers) {
    if (
      breed1.geneticMarkers?.eggProductionGenes === "High" ||
      breed2.geneticMarkers?.eggProductionGenes === "High"
    ) {
      traits.push("High egg production potential");
    }
    if (
      breed1.geneticMarkers?.meatQualityGenes === "High" ||
      breed2.geneticMarkers?.meatQualityGenes === "High"
    ) {
      traits.push("Good meat production traits");
    }
    if (
      breed1.geneticMarkers?.adaptabilityGenes === "Strong" ||
      breed2.geneticMarkers?.adaptabilityGenes === "Strong"
    ) {
      traits.push("Strong adaptability");
    }
  }

  // Add common positive traits
  if (breed1.foraging === "Excellent" || breed2.foraging === "Excellent") {
    traits.push("Good foraging ability");
  }
  if (breed1.broodiness === "Good" || breed2.broodiness === "Good") {
    traits.push("Potential for good maternal instincts");
  }

  return traits.length > 0
    ? traits
    : ["Hybrid vigor benefits", "Mixed trait expression"];
}

function getSpecialConsiderations(breed1, breed2) {
  const considerations = [];

  if (breed1.specialNotes || breed2.specialNotes) {
    considerations.push("Special inherited traits may appear");
  }

  if (breed1.type !== breed2.type) {
    considerations.push("Mixed purpose characteristics expected");
  }

  return considerations.join(". ");
}

const BreedingManagementPage = () => {
  // Initialize state from localStorage or default values
  const [breed1, setBreed1] = useState("");
  const [breed2, setBreed2] = useState("");
  const [breedingResult, setBreedingResult] = useState(null);
  const [history, setHistory] = useState(() => {
    const savedHistory = localStorage.getItem("breedingHistory");
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("breedingActiveTab") || "calculator";
  });
  const [filterPurpose, setFilterPurpose] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("breedingHistory", JSON.stringify(history));
  }, [history]);

  // Save active tab to localStorage
  useEffect(() => {
    localStorage.setItem("breedingActiveTab", activeTab);
  }, [activeTab]);

  // Get pure breeds from database
  const pureBreeds = Object.entries(breedDatabase)
    .filter(([_, data]) => data.category === "Pure Breed")
    .map(([name]) => name);

  const handleBreed = (e) => {
    e.preventDefault();
    const result = calculateBreedingResult(breed1.trim(), breed2.trim());
    setBreedingResult(result);
    if (result) {
      const newEntry = {
        id: Date.now(),
        breed1,
        breed2,
        result,
        date: new Date().toISOString(),
        isFavorite: false,
      };
      setHistory([newEntry, ...history]);
    }
  };

  const toggleFavorite = (id) => {
    setHistory(
      history.map((entry) =>
        entry.id === id ? { ...entry, isFavorite: !entry.isFavorite } : entry
      )
    );
  };

  const filteredHistory = history.filter((entry) => {
    // Simple search across breed names and characteristics
    const searchLower = searchQuery.toLowerCase();
    const searchMatch =
      !searchQuery ||
      entry.breed1.toLowerCase().includes(searchLower) ||
      entry.breed2.toLowerCase().includes(searchLower);

    // Simplified purpose filtering
    const purpose = entry.result.expectedTraits.purpose?.toLowerCase() || "";
    const purposeMatch =
      filterPurpose === "all" || purpose.includes(filterPurpose.toLowerCase());

    return searchMatch && purposeMatch;
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Breeding Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Calculate and track breeding combinations
          </p>
        </div>
        <Badge
          variant="default"
          className="px-4 py-1 bg-primary text-primary-foreground"
        >
          {pureBreeds.length} Pure Breeds Available
        </Badge>
      </div>

      <Tabs
        defaultValue={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculator
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Favorites
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[1fr,1.5fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dna className="h-5 w-5" />
                  Breed Selection
                </CardTitle>
                <CardDescription>
                  Choose breeds to calculate cross
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBreed} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="breed1">First Breed</Label>
                      <Select value={breed1} onValueChange={setBreed1}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select first breed" />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-72">
                            {pureBreeds.map((breed) => (
                              <SelectItem key={breed} value={breed}>
                                {breed}
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>

                    {breed1 && (
                      <Card className="bg-muted">
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm">
                            First Breed Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-sm space-y-2">
                            <p>
                              <span className="font-medium">Type:</span>{" "}
                              {breedDatabase[breed1].type}
                            </p>
                            <p>
                              <span className="font-medium">Origin:</span>{" "}
                              {breedDatabase[breed1].origin}
                            </p>
                            <p>
                              <span className="font-medium">
                                Characteristics:
                              </span>{" "}
                              {breedDatabase[breed1].characteristics}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div>
                      <Label htmlFor="breed2">Second Breed</Label>
                      <Select value={breed2} onValueChange={setBreed2}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select second breed" />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-72">
                            {pureBreeds.map((breed) => (
                              <SelectItem key={breed} value={breed}>
                                {breed}
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>

                    {breed2 && (
                      <Card className="bg-muted">
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm">
                            Second Breed Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-sm space-y-2">
                            <p>
                              <span className="font-medium">Type:</span>{" "}
                              {breedDatabase[breed2].type}
                            </p>
                            <p>
                              <span className="font-medium">Origin:</span>{" "}
                              {breedDatabase[breed2].origin}
                            </p>
                            <p>
                              <span className="font-medium">
                                Characteristics:
                              </span>{" "}
                              {breedDatabase[breed2].characteristics}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-12"
                      disabled={!breed1 || !breed2}
                    >
                      Calculate Cross
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {breedingResult && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      {breedingResult.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(history[0]?.id)}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          history[0]?.isFavorite ? "fill-primary" : ""
                        }`}
                      />
                    </Button>
                  </div>
                  <CardDescription>
                    {breedingResult.characteristics}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <LineChart className="h-5 w-5" />
                      Expected Traits
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(breedingResult.expectedTraits).map(
                        ([trait, value]) => (
                          <div
                            key={trait}
                            className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                          >
                            <p className="font-medium capitalize">
                              {trait.replace(/([A-Z])/g, " $1").trim()}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {value}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium mb-4">
                      Genetic Predictions
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h5 className="font-medium">Dominant Traits:</h5>
                        <ul className="space-y-1.5">
                          {breedingResult.geneticPredictions.dominantTraits.map(
                            (trait, index) => (
                              <li
                                key={index}
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {trait}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-medium">Heterosis Effects:</h5>
                        <ul className="space-y-1.5">
                          {breedingResult.geneticPredictions.heterosisEffects.map(
                            (effect, index) => (
                              <li
                                key={index}
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {effect}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Breeding Considerations</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside text-sm space-y-1.5 mt-2">
                        {breedingResult.breedingConsiderations.map(
                          (consideration, index) => (
                            <li key={index}>{consideration}</li>
                          )
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Breeding History
                  </CardTitle>
                  <CardDescription>
                    Previous breeding calculations
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="filterPurpose">Category:</Label>
                    <Select
                      value={filterPurpose}
                      onValueChange={setFilterPurpose}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="layer">Egg Layers</SelectItem>
                        <SelectItem value="meat">Meat Birds</SelectItem>
                        <SelectItem value="dual">Dual Purpose</SelectItem>
                        <SelectItem value="ornamental">Ornamental</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Search breeds..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[200px]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {filteredHistory.map((item) => (
                    <Card key={item.id} className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4"
                        onClick={() => toggleFavorite(item.id)}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            item.isFavorite ? "fill-yellow-400" : ""
                          }`}
                        />
                      </Button>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {item.breed1} × {item.breed2}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <span>
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                          <Badge variant="outline">
                            {item.result.expectedTraits.purpose}
                          </Badge>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <p className="font-medium">Egg Production</p>
                            <p className="text-sm text-muted-foreground">
                              {item.result.expectedTraits.eggProduction}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">Temperament</p>
                            <p className="text-sm text-muted-foreground">
                              {item.result.expectedTraits.temperament}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">Hybrid Vigor</p>
                            <p className="text-sm text-muted-foreground">
                              {item.result.expectedTraits.hybridVigor}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredHistory.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Info className="mx-auto h-12 w-12 mb-4" />
                      <p>No breeding history found</p>
                      {searchQuery || filterPurpose !== "all" ? (
                        <p className="text-sm">Try adjusting your filters</p>
                      ) : null}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Favorite Combinations
              </CardTitle>
              <CardDescription>
                Your saved breeding combinations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {history
                    .filter((item) => item.isFavorite)
                    .map((item) => (
                      <Card key={item.id}>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {item.breed1} × {item.breed2}
                          </CardTitle>
                          <CardDescription>
                            {new Date(item.date).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <p className="font-medium">Purpose</p>
                              <Badge variant="outline">
                                {item.result.expectedTraits.purpose}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <p className="font-medium">Egg Production</p>
                              <p className="text-sm text-muted-foreground">
                                {item.result.expectedTraits.eggProduction}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <p className="font-medium">Hybrid Vigor</p>
                              <p className="text-sm text-muted-foreground">
                                {item.result.expectedTraits.hybridVigor}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {!history.some((item) => item.isFavorite) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Star className="mx-auto h-12 w-12 mb-4" />
                      <p>No favorite combinations yet</p>
                      <p className="text-sm">
                        Star your preferred breeding combinations to save them
                        here
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BreedingManagementPage;

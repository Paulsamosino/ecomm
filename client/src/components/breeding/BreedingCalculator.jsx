import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { breedingService } from "@/services/breedingService";
import { toast } from "react-hot-toast";
import {
  Calculator,
  Star,
  History,
  Dna,
  AlertCircle,
  Info,
  ChevronRight,
  ChevronDown,
  Egg,
  Feather,
  Scale,
  Thermometer,
  Heart,
} from "lucide-react";

const BreedingCalculator = () => {
  const [breed1, setBreed1] = useState("");
  const [breed2, setBreed2] = useState("");
  const [breedingResult, setBreedingResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState("calculator");
  const [filterPurpose, setFilterPurpose] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pureBreeds, setPureBreeds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResultLoading, setIsResultLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load pure breeds
      const breeds = await breedingService.getBreeds();
      setPureBreeds(breeds);

      // Load history
      const calculations = await breedingService.getRecentCalculations();
      setHistory(calculations);

      // Load favorites
      const favs = await breedingService.getFavoriteBreedingPairs();
      setFavorites(favs);
    } catch (error) {
      console.error("Failed to load breeding data:", error);
      toast.error("Failed to load breeding data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBreed = async (e) => {
    e.preventDefault();
    if (!breed1 || !breed2) {
      toast.error("Please select both breeds");
      return;
    }

    setIsResultLoading(true);
    try {
      const result = await breedingService.calculateBreedingCompatibility(
        breed1,
        breed2
      );

      setBreedingResult(result);

      if (result) {
        const newEntry = {
          id: Date.now().toString(),
          breed1,
          breed2,
          result,
          date: new Date().toISOString(),
          isFavorite: false,
        };

        setHistory([newEntry, ...history]);
        await breedingService.addToRecentCalculations(newEntry);
      }
    } catch (error) {
      console.error("Failed to calculate breeding compatibility:", error);
      toast.error("Failed to calculate breeding compatibility");
    } finally {
      setIsResultLoading(false);
    }
  };

  const toggleFavorite = async (id) => {
    try {
      const updatedHistory = history.map((entry) =>
        entry.id === id ? { ...entry, isFavorite: !entry.isFavorite } : entry
      );
      setHistory(updatedHistory);

      const entry = updatedHistory.find((e) => e.id === id);

      if (entry.isFavorite) {
        await breedingService.addToFavoriteBreedingPairs(entry);
        setFavorites([entry, ...favorites]);
      } else {
        await breedingService.removeFromFavoriteBreedingPairs(id);
        setFavorites(favorites.filter((fav) => fav.id !== id));
      }
    } catch (error) {
      console.error("Failed to update favorites:", error);
      toast.error("Failed to update favorites");
    }
  };

  const filteredHistory = history.filter((entry) => {
    if (!entry) return false;

    const searchLower = searchQuery.toLowerCase();
    const searchMatch =
      !searchQuery ||
      (entry.breed1 || "").toLowerCase().includes(searchLower) ||
      (entry.breed2 || "").toLowerCase().includes(searchLower);

    // Safe access to nested properties with fallback
    const purpose = entry?.result?.expectedTraits?.purpose?.toLowerCase() ?? "";
    const purposeMatch =
      filterPurpose === "all" ||
      (purpose && purpose.includes(filterPurpose.toLowerCase()));

    return searchMatch && purposeMatch;
  });

  const renderTraitValue = (value) => {
    if (typeof value === "number") {
      return (
        <div className="flex items-center">
          <Progress value={value} className="h-2 w-24 mr-2" />
          <span>{value}%</span>
        </div>
      );
    }
    return value;
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

  const renderBreedingResult = () => {
    if (!breedingResult) return null;

    return (
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {breedingResult.name}
                {getCompatibilityBadge(breedingResult.compatibilityScore)}
              </CardTitle>
              <CardDescription className="mt-1">
                {breedingResult.description}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                toggleFavorite(
                  history.find(
                    (h) => h.breed1 === breed1 && h.breed2 === breed2
                  )?.id
                )
              }
              disabled={isResultLoading}
            >
              <Star
                className={`h-4 w-4 ${
                  history.find(
                    (h) =>
                      h.breed1 === breed1 && h.breed2 === breed2 && h.isFavorite
                  )
                    ? "fill-yellow-400 text-yellow-400"
                    : ""
                }`}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-medium text-sm mb-2">Compatibility Score</h3>
              <div className="flex items-center">
                <Progress
                  value={breedingResult.compatibilityScore}
                  className="h-2 w-full mr-2"
                />
                <span className="text-sm font-medium">
                  {breedingResult.compatibilityScore}%
                </span>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-sm mb-2">Hybrid Vigor</h3>
              <div className="flex items-center">
                <Progress
                  value={breedingResult.hybridVigor}
                  className="h-2 w-full mr-2"
                />
                <span className="text-sm font-medium">
                  {breedingResult.hybridVigor}%
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-3">Expected Traits</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-start gap-2">
                <Egg className="h-4 w-4 mt-0.5 text-amber-500" />
                <div>
                  <span className="font-medium text-sm">Egg Production</span>
                  <div className="text-sm">
                    {renderTraitValue(
                      breedingResult.expectedTraits.eggProduction
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Scale className="h-4 w-4 mt-0.5 text-blue-500" />
                <div>
                  <span className="font-medium text-sm">Meat Production</span>
                  <div className="text-sm">
                    {renderTraitValue(
                      breedingResult.expectedTraits.meatProduction
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Thermometer className="h-4 w-4 mt-0.5 text-red-500" />
                <div>
                  <span className="font-medium text-sm">
                    Climate Adaptability
                  </span>
                  <div className="text-sm">
                    {renderTraitValue(
                      breedingResult.expectedTraits.climateAdaptability
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Heart className="h-4 w-4 mt-0.5 text-green-500" />
                <div>
                  <span className="font-medium text-sm">Health Robustness</span>
                  <div className="text-sm">
                    {renderTraitValue(
                      breedingResult.expectedTraits.healthRobustness
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Feather className="h-4 w-4 mt-0.5 text-purple-500" />
                <div>
                  <span className="font-medium text-sm">Temperament</span>
                  <div className="text-sm">
                    {renderTraitValue(
                      breedingResult.expectedTraits.temperament
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-2">Breeding Recommendations</h3>
            <ul className="space-y-2 text-sm">
              {breedingResult.recommendations && breedingResult.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {breedingResult.warnings && breedingResult.warnings.length > 0 && (
            <>
              <Separator />
              <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                <h3 className="font-medium mb-2 flex items-center text-amber-800">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Breeding Considerations
                </h3>
                <ul className="space-y-2 text-sm text-amber-800">
                  {breedingResult.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderHistoryItem = (entry, isFavorite = false) => {
    if (!entry || !entry.result) return null;

    return (
      <Card key={entry.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base">
                {entry.breed1} × {entry.breed2}
              </CardTitle>
              <CardDescription className="text-xs">
                {new Date(entry.date).toLocaleDateString()} -{" "}
                {entry.result.name}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFavorite(entry.id)}
            >
              <Star
                className={`h-4 w-4 ${
                  entry.isFavorite ? "fill-yellow-400 text-yellow-400" : ""
                }`}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-3 pt-0">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <span className="text-muted-foreground mr-2">Compatibility:</span>
              <Progress
                value={entry.result.compatibilityScore}
                className="h-2 w-24 mr-2"
              />
              <span>{entry.result.compatibilityScore}%</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setBreed1(entry.breed1);
                setBreed2(entry.breed2);
                setBreedingResult(entry.result);
                setActiveTab("calculator");
              }}
            >
              View Details
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs
        defaultValue={activeTab}
        value={activeTab}
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
                  Choose breeds to calculate compatibility and predicted traits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBreed} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="breed1">First Breed</Label>
                      <Select value={breed1} onValueChange={setBreed1}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select first breed" />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-72">
                            {pureBreeds.map((breed) => (
                              <SelectItem key={`first-${breed}`} value={breed}>
                                {breed}
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="breed2">Second Breed</Label>
                      <Select value={breed2} onValueChange={setBreed2}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select second breed" />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-72">
                            {pureBreeds.map((breed) => (
                              <SelectItem key={`second-${breed}`} value={breed}>
                                {breed}
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!breed1 || !breed2 || isResultLoading}
                    >
                      {isResultLoading
                        ? "Calculating..."
                        : "Calculate Breeding"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {breedingResult ? (
              renderBreedingResult()
            ) : (
              <Card className="flex flex-col items-center justify-center p-6">
                <Dna className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Select Breeds to Calculate
                </h3>
                <p className="text-center text-muted-foreground">
                  Choose two breeds to see compatibility scores and predicted
                  offspring traits
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Calculations
              </CardTitle>
              <CardDescription>
                View your recent breeding calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Search breeds..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Select
                    value={filterPurpose}
                    onValueChange={setFilterPurpose}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Purposes</SelectItem>
                      <SelectItem value="egg">Egg Production</SelectItem>
                      <SelectItem value="meat">Meat Production</SelectItem>
                      <SelectItem value="dual">Dual Purpose</SelectItem>
                      <SelectItem value="ornamental">Ornamental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <ScrollArea className="h-[400px] pr-4">
                  {filteredHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Info className="h-10 w-10 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Results</h3>
                      <p className="text-center text-muted-foreground">
                        No breeding calculations match your filters
                      </p>
                    </div>
                  ) : (
                    filteredHistory.map((entry) => renderHistoryItem(entry))
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
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
              <ScrollArea className="h-[400px] pr-4">
                {favorites.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Star className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Favorites</h3>
                    <p className="text-center text-muted-foreground">
                      Star your favorite breeding combinations to save them here
                    </p>
                  </div>
                ) : (
                  favorites.map((entry) => renderHistoryItem(entry, true))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BreedingCalculator;

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  Star,
  Search,
  Check,
  X,
  Dna,
  BarChart,
  Filter,
  Heart,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import breedingService from "@/services/breedingService";
import toast from "react-hot-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BreedingRecommendations = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [filters, setFilters] = useState({
    purpose: "all",
    minCompatibility: 70,
    breedType: "all",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBreed, setSelectedBreed] = useState("");
  const [breedsByCategory, setBreedsByCategory] = useState({
    chicken: [],
    duck: [],
    turkey: [],
  });
  const [activeCategory, setActiveCategory] = useState("chicken");
  const [incubationPeriods] = useState({
    chicken: 21,
    duck: 28,
    turkey: 28,
  });

  useEffect(() => {
    loadProducts();
    loadBreeds();
  }, []);

  useEffect(() => {
    if (selectedBreed) {
      generateRecommendations(selectedBreed);
    }
  }, [selectedBreed, filters, activeCategory]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const breedingStock = await breedingService.getBreedingStock();
      setProducts(breedingStock);
    } catch (error) {
      console.error("Error loading breeding stock:", error);
      toast.error("Failed to load breeding stock. Using sample data.");
    } finally {
      setLoading(false);
    }
  };

  const loadBreeds = async () => {
    try {
      const breeds = await breedingService.getBreeds();

      // Group breeds by category
      const groupedBreeds = {
        chicken: [],
        duck: [],
        turkey: [],
      };

      breeds.forEach((breed) => {
        const category = breed.category?.toLowerCase() || "unknown";
        if (groupedBreeds[category]) {
          groupedBreeds[category].push(breed.name);
        }
      });

      // If any category is empty, try to extract from products
      Object.keys(groupedBreeds).forEach((category) => {
        if (groupedBreeds[category].length === 0) {
          const categoryProducts = products.filter(
            (p) => p.category?.toLowerCase() === category
          );
          const uniqueBreeds = [
            ...new Set(categoryProducts.map((p) => p.breed).filter(Boolean)),
          ];
          groupedBreeds[category] = uniqueBreeds;
        }
      });

      setBreedsByCategory(groupedBreeds);
    } catch (error) {
      console.error("Error loading breeds:", error);
      toast.error("Failed to load breeds. Using sample data.");
    }
  };

  const generateRecommendations = async (breed) => {
    try {
      setLoading(true);

      // Filter available products that match our criteria
      const availableStockForBreeding = products.filter((product) => {
        // Category filter - only match with same species
        if (product.category?.toLowerCase() !== activeCategory.toLowerCase()) {
          return false;
        }

        // Purpose filter
        if (filters.purpose !== "all") {
          const purpose = product.specifications?.find(
            (spec) => spec.name === "Purpose"
          )?.value;
          if (
            !purpose ||
            !purpose.toLowerCase().includes(filters.purpose.toLowerCase())
          ) {
            return false;
          }
        }

        // Breed type filter
        if (filters.breedType !== "all") {
          if (filters.breedType === "pure" && product.breed.includes("Cross")) {
            return false;
          }
          if (
            filters.breedType === "cross" &&
            !product.breed.includes("Cross")
          ) {
            return false;
          }
        }

        // Filter out the selected breed itself
        if (product.breed === breed) {
          return false;
        }

        return true;
      });

      // Generate compatibility scores
      const recommendationsList = await Promise.all(
        availableStockForBreeding.map(async (product) => {
          // Calculate compatibility based on breed characteristics
          const selectedBreedProducts = products.filter(
            (p) => p.breed === breed
          );
          let compatibilityScore = 75; // Base score
          const reasons = [];

          // Category-specific traits
          if (activeCategory === "chicken") {
            // Egg production compatibility for chickens
            const productEggProduction = product.specifications?.find(
              (spec) => spec.name === "Egg Production"
            )?.value;
            const breedEggProduction =
              selectedBreedProducts[0]?.specifications?.find(
                (spec) => spec.name === "Egg Production"
              )?.value;

            if (
              productEggProduction === "High" ||
              productEggProduction === "Very High"
            ) {
              compatibilityScore += 5;
              reasons.push("High egg production potential");
            }

            // Check for complementary traits
            if (
              breedEggProduction === "Low" &&
              productEggProduction === "High"
            ) {
              compatibilityScore += 10;
              reasons.push("Complementary egg production traits");
            }
          }

          if (activeCategory === "duck") {
            // Ducks have better foraging
            const isForager =
              product.name.toLowerCase().includes("runner") ||
              product.breed.toLowerCase().includes("campbell");
            if (isForager) {
              compatibilityScore += 5;
              reasons.push("Good foraging ability");
            }

            // Water adaptation
            const isWaterAdapted =
              product.breed.toLowerCase().includes("pekin") ||
              product.breed.toLowerCase().includes("cayuga");
            if (isWaterAdapted) {
              compatibilityScore += 5;
              reasons.push("Good water adaptation");
            }
          }

          if (activeCategory === "turkey") {
            // Heritage breeds are hardier
            const isHeritage =
              product.name.toLowerCase().includes("heritage") ||
              product.breed.toLowerCase().includes("bourbon");
            if (isHeritage) {
              compatibilityScore += 5;
              reasons.push("Heritage breed hardiness");
            }

            // Size compatibility
            const isLarge =
              product.name.toLowerCase().includes("broad") ||
              product.breed.toLowerCase().includes("bronze");
            if (isLarge) {
              compatibilityScore += 5;
              reasons.push("Good size potential");
            }
          }

          // General compatibility checks

          // Temperament compatibility
          const productTemp = product.specifications?.find(
            (spec) => spec.name === "Temperament"
          )?.value;
          const selectedTemp = selectedBreedProducts[0]?.specifications?.find(
            (spec) => spec.name === "Temperament"
          )?.value;

          if (productTemp && selectedTemp) {
            if (productTemp === selectedTemp) {
              compatibilityScore += 10;
              reasons.push(`Matching temperament (${productTemp})`);
            } else if (
              (productTemp === "Calm" && selectedTemp === "Friendly") ||
              (productTemp === "Friendly" && selectedTemp === "Calm")
            ) {
              compatibilityScore += 5;
              reasons.push(
                `Compatible temperaments (${productTemp} & ${selectedTemp})`
              );
            }
          }

          // Climate adaptation
          const productColdHardy =
            product.specifications?.find((spec) => spec.name === "Cold Hardy")
              ?.value === "Yes";
          const selectedColdHardy =
            selectedBreedProducts[0]?.specifications?.find(
              (spec) => spec.name === "Cold Hardy"
            )?.value === "Yes";

          if (productColdHardy && selectedColdHardy) {
            compatibilityScore += 5;
            reasons.push("Both breeds are cold hardy");
          }

          const productHeatTolerant =
            product.specifications?.find(
              (spec) => spec.name === "Heat Tolerant"
            )?.value === "Yes";
          const selectedHeatTolerant =
            selectedBreedProducts[0]?.specifications?.find(
              (spec) => spec.name === "Heat Tolerant"
            )?.value === "Yes";

          if (productHeatTolerant && selectedHeatTolerant) {
            compatibilityScore += 5;
            reasons.push("Both breeds are heat tolerant");
          }

          // Purpose compatibility
          const productPurpose = product.specifications?.find(
            (spec) => spec.name === "Purpose"
          )?.value;
          const selectedPurpose =
            selectedBreedProducts[0]?.specifications?.find(
              (spec) => spec.name === "Purpose"
            )?.value;

          if (
            productPurpose &&
            selectedPurpose &&
            productPurpose === selectedPurpose
          ) {
            compatibilityScore += 5;
            reasons.push(`Matching purpose (${productPurpose})`);
          }

          // Generate predicted traits
          const predictedTraits = {
            eggProduction: predictEggProduction(
              selectedBreedProducts[0],
              product
            ),
            temperament: predictTemperament(selectedBreedProducts[0], product),
            coldHardy: productColdHardy || selectedColdHardy,
            heatTolerant: productHeatTolerant || selectedHeatTolerant,
            size: predictSize(selectedBreedProducts[0], product),
            broodiness: predictBroodiness(selectedBreedProducts[0], product),
          };

          // Add incubation information
          predictedTraits.incubationPeriod =
            incubationPeriods[activeCategory] || "Variable";

          // Add at least one reason if none were generated
          if (reasons.length === 0) {
            reasons.push("Compatible breeding stock");
          }

          // Cap the score
          compatibilityScore = Math.min(
            Math.max(Math.round(compatibilityScore), 0),
            100
          );

          return {
            product,
            compatibilityScore,
            predictedTraits,
            reasons,
          };
        })
      );

      // Filter by minimum compatibility score
      const filteredRecommendations = recommendationsList.filter(
        (rec) => rec.compatibilityScore >= filters.minCompatibility
      );

      // Sort by compatibility score (highest first)
      filteredRecommendations.sort(
        (a, b) => b.compatibilityScore - a.compatibilityScore
      );

      setRecommendations(filteredRecommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      toast.error("Could not generate breeding recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const predictEggProduction = (breed1, breed2) => {
    const eggProd1 = breed1?.specifications?.find(
      (spec) => spec.name === "Egg Production"
    )?.value;
    const eggProd2 = breed2?.specifications?.find(
      (spec) => spec.name === "Egg Production"
    )?.value;

    if (!eggProd1 || !eggProd2) return "Variable";

    const levels = ["Low", "Medium", "High", "Very High"];
    const index1 = levels.indexOf(eggProd1);
    const index2 = levels.indexOf(eggProd2);

    if (index1 === -1 || index2 === -1) return "Variable";

    // Average the production levels, with slight hybrid vigor boost
    const avgIndex = Math.min(
      Math.floor((index1 + index2) / 2) + 1,
      levels.length - 1
    );
    return levels[avgIndex];
  };

  const predictTemperament = (breed1, breed2) => {
    const temp1 = breed1?.specifications?.find(
      (spec) => spec.name === "Temperament"
    )?.value;
    const temp2 = breed2?.specifications?.find(
      (spec) => spec.name === "Temperament"
    )?.value;

    if (!temp1 || !temp2) return "Mixed";

    if (temp1 === temp2) return temp1;

    // Some known good combinations
    if (
      (temp1 === "Calm" && temp2 === "Friendly") ||
      (temp1 === "Friendly" && temp2 === "Calm")
    ) {
      return "Calm/Friendly";
    }

    if (
      (temp1 === "Active" && temp2 === "Friendly") ||
      (temp1 === "Friendly" && temp2 === "Active")
    ) {
      return "Friendly/Active";
    }

    return "Mixed";
  };

  const predictSize = (breed1, breed2) => {
    // This is a simplification - in real-world, you'd have more precise data
    if (!breed1 || !breed2) return "Average";

    const isLargeBreed1 =
      breed1.name.toLowerCase().includes("jersey") ||
      breed1.breed.toLowerCase().includes("brahma");
    const isLargeBreed2 =
      breed2.name.toLowerCase().includes("jersey") ||
      breed2.breed.toLowerCase().includes("brahma");

    if (isLargeBreed1 && isLargeBreed2) return "Larger than average";
    if (isLargeBreed1 || isLargeBreed2) return "Above average";

    const isSmallBreed1 =
      breed1.name.toLowerCase().includes("bantam") ||
      breed1.breed.toLowerCase().includes("silkie");
    const isSmallBreed2 =
      breed2.name.toLowerCase().includes("bantam") ||
      breed2.breed.toLowerCase().includes("silkie");

    if (isSmallBreed1 && isSmallBreed2) return "Smaller than average";
    if (isSmallBreed1 || isSmallBreed2) return "Below average";

    return "Average";
  };

  const predictBroodiness = (breed1, breed2) => {
    // Breeds known for broodiness
    const broodyBreeds = [
      "silkie",
      "cochin",
      "orpington",
      "brahma",
      "sussex",
      "wyandotte",
    ];

    const isBreed1Broody = broodyBreeds.some(
      (b) =>
        breed1?.breed?.toLowerCase().includes(b) ||
        breed1?.name?.toLowerCase().includes(b)
    );

    const isBreed2Broody = broodyBreeds.some(
      (b) =>
        breed2?.breed?.toLowerCase().includes(b) ||
        breed2?.name?.toLowerCase().includes(b)
    );

    if (isBreed1Broody && isBreed2Broody) return "Very good";
    if (isBreed1Broody || isBreed2Broody) return "Good";

    return "Variable";
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleBreedSelect = (breed) => {
    setSelectedBreed(breed);
    toast.success(`Generating recommendations for ${breed}`);
  };

  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value,
    });
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setSelectedBreed("");
    setRecommendations([]);
  };

  const handleAddToWishlist = (productId) => {
    toast.success("This product has been added to your wishlist.");
  };

  const filteredRecommendations = recommendations.filter((rec) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      rec.product.name.toLowerCase().includes(query) ||
      rec.product.breed.toLowerCase().includes(query) ||
      rec.reasons.some((reason) => reason.toLowerCase().includes(query))
    );
  });

  const getCompatibilityColor = (score) => {
    if (score >= 90) return "bg-green-100 text-green-800";
    if (score >= 80) return "bg-green-50 text-green-800";
    if (score >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getCategoryBreeds = () => {
    return breedsByCategory[activeCategory] || [];
  };

  const filteredBreeds = getCategoryBreeds().filter((breed) =>
    breed.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Breeding Recommendations</h2>
      </div>

      <Tabs
        defaultValue="chicken"
        value={activeCategory}
        onValueChange={handleCategoryChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chicken">Chickens</TabsTrigger>
          <TabsTrigger value="duck">Ducks</TabsTrigger>
          <TabsTrigger value="turkey">Turkeys</TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Select{" "}
                    {activeCategory.charAt(0).toUpperCase() +
                      activeCategory.slice(1)}{" "}
                    Breed
                  </CardTitle>
                  <CardDescription>
                    Choose a breed to find compatible breeding matches
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search breeds..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-1">
                        {filteredBreeds.length > 0 ? (
                          filteredBreeds.map((breed) => (
                            <div
                              key={breed}
                              className={`p-2 cursor-pointer rounded-md hover:bg-gray-100 ${
                                selectedBreed === breed ? "bg-gray-100" : ""
                              }`}
                              onClick={() => handleBreedSelect(breed)}
                            >
                              {breed}
                              {selectedBreed === breed && (
                                <Check className="inline-block ml-2 h-4 w-4 text-green-600" />
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 p-2">
                            No {activeCategory} breeds found matching your
                            search
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                  <CardDescription>
                    Refine your breeding recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="purpose">Purpose</Label>
                      <Select
                        value={filters.purpose}
                        onValueChange={(value) =>
                          handleFilterChange("purpose", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Purposes</SelectItem>
                          <SelectItem value="egg">Egg Production</SelectItem>
                          <SelectItem value="meat">Meat Production</SelectItem>
                          <SelectItem value="dual">Dual Purpose</SelectItem>
                          <SelectItem value="show">Show</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="breed-type">Breed Type</Label>
                      <Select
                        value={filters.breedType}
                        onValueChange={(value) =>
                          handleFilterChange("breedType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select breed type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="pure">Pure Breeds</SelectItem>
                          <SelectItem value="cross">Hybrids/Crosses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="compatibility">
                          Min. Compatibility
                        </Label>
                        <span className="text-sm text-gray-500">
                          {filters.minCompatibility}%
                        </span>
                      </div>
                      <Input
                        id="compatibility"
                        type="range"
                        min="50"
                        max="100"
                        step="5"
                        value={filters.minCompatibility}
                        onChange={(e) =>
                          handleFilterChange(
                            "minCompatibility",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {activeCategory === "chicken" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Chicken Breeding Facts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2">
                      <li>• Incubation period: 21 days</li>
                      <li>• Egg production typically starts at 5-6 months</li>
                      <li>• Chickens can remain productive for 2-3 years</li>
                      <li>
                        • Roosters should be at least 6 months old for breeding
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              )}

              {activeCategory === "duck" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Duck Breeding Facts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2">
                      <li>• Incubation period: 28 days</li>
                      <li>• Egg production typically starts at 4-7 months</li>
                      <li>• Ducks tend to lay eggs seasonally</li>
                      <li>
                        • Drakes should be at least 6 months old for breeding
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              )}

              {activeCategory === "turkey" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Turkey Breeding Facts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2">
                      <li>• Incubation period: 28 days</li>
                      <li>• Egg production typically starts at 7-8 months</li>
                      <li>• Turkeys are highly seasonal breeders</li>
                      <li>
                        • Toms should be at least 7 months old for breeding
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="md:col-span-2">
              {!selectedBreed ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No breed selected</AlertTitle>
                  <AlertDescription>
                    Select a {activeCategory} breed from the list to see
                    breeding recommendations.
                  </AlertDescription>
                </Alert>
              ) : loading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredRecommendations.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No matches found</AlertTitle>
                  <AlertDescription>
                    No breeding stock matches your current criteria. Try
                    adjusting your filters.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      Recommendations for {selectedBreed}
                    </h3>
                    <div className="text-sm text-gray-500">
                      {filteredRecommendations.length} matches found
                    </div>
                  </div>

                  <div className="space-y-4">
                    {filteredRecommendations.map((recommendation) => (
                      <Card key={recommendation.product._id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="w-full md:w-1/3">
                              <img
                                src={
                                  recommendation.product.images?.[0] ||
                                  "/1f425.png"
                                }
                                alt={recommendation.product.name}
                                className="w-full h-40 object-cover rounded-md"
                              />
                            </div>
                            <div className="w-full md:w-2/3 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-lg">
                                  {recommendation.product.name}
                                </h4>
                                <Badge
                                  className={getCompatibilityColor(
                                    recommendation.compatibilityScore
                                  )}
                                >
                                  {recommendation.compatibilityScore}%
                                  Compatible
                                </Badge>
                              </div>

                              <p className="text-sm text-gray-500">
                                Breed: {recommendation.product.breed}
                              </p>

                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="font-medium">Age:</span>{" "}
                                  {recommendation.product.age} months
                                </div>
                                <div>
                                  <span className="font-medium">Price:</span> $
                                  {recommendation.product.price}
                                </div>
                                {activeCategory !== "turkey" && (
                                  <div>
                                    <span className="font-medium">
                                      Egg Production:
                                    </span>{" "}
                                    {
                                      recommendation.predictedTraits
                                        .eggProduction
                                    }
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium">
                                    Temperament:
                                  </span>{" "}
                                  {recommendation.predictedTraits.temperament}
                                </div>
                                <div>
                                  <span className="font-medium">
                                    Incubation:
                                  </span>{" "}
                                  {
                                    recommendation.predictedTraits
                                      .incubationPeriod
                                  }{" "}
                                  days
                                </div>
                                <div>
                                  <span className="font-medium">
                                    Broodiness:
                                  </span>{" "}
                                  {recommendation.predictedTraits.broodiness}
                                </div>
                              </div>

                              <div>
                                <h5 className="font-medium text-sm mb-1">
                                  Why this match:
                                </h5>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  {recommendation.reasons.map(
                                    (reason, index) => (
                                      <li
                                        key={index}
                                        className="flex items-center"
                                      >
                                        <Check className="h-3 w-3 text-green-600 mr-2" />
                                        {reason}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>

                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleAddToWishlist(
                                      recommendation.product._id
                                    )
                                  }
                                >
                                  <Heart className="h-4 w-4 mr-2" />
                                  Add to Wishlist
                                </Button>
                                <Button size="sm">View Details</Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BreedingRecommendations;

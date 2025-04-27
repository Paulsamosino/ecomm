import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Star, Dna, ArrowRight, Info, Heart } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import breedingService from "@/services/breedingService";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import toast from "react-hot-toast";

const ProductBreedingCalculator = () => {
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedSire, setSelectedSire] = useState("");
  const [selectedDam, setSelectedDam] = useState("");
  const [compatibility, setCompatibility] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBreedingStock();
  }, []);

  const loadBreedingStock = async () => {
    try {
      setLoading(true);
      const data = await breedingService.getBreedingStock();

      // Make sure each product has a sex field - default to random if not available
      const productsWithSex = data.map((product) => ({
        ...product,
        sex: product.sex || (Math.random() > 0.5 ? "Male" : "Female"), // Randomly assign sex if not present
      }));

      setProducts(productsWithSex);
      setError(null);
    } catch (err) {
      setError("Failed to load breeding stock");
      toast.error("Could not load breeding stock");
    } finally {
      setLoading(false);
    }
  };

  const calculateCompatibility = async () => {
    if (!selectedSire || !selectedDam) return;

    try {
      setCalculating(true);
      setError(null);

      const result = await breedingService.calculateBreedingCompatibility(
        selectedSire,
        selectedDam
      );

      setCompatibility(result);
      toast.success("Breeding compatibility calculated");
    } catch (err) {
      setError("Failed to calculate breeding compatibility");
      toast.error("Could not calculate compatibility");
    } finally {
      setCalculating(false);
    }
  };

  const getCompatibilityColor = (score) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getProgressColor = (score) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Selected products for display
  const selectedSireProduct = products.find((p) => p._id === selectedSire);
  const selectedDamProduct = products.find((p) => p._id === selectedDam);

  return (
    <Card className="shadow-lg border-t-4 border-t-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dna className="h-5 w-5 text-primary" />
          Breeding Compatibility Calculator
        </CardTitle>
        <CardDescription>
          Calculate genetic compatibility between breeding stock
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive" className="animate-in fade-in-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-2">
                    Male Breeder (Sire)
                  </label>
                  <Select
                    value={selectedSire}
                    onValueChange={setSelectedSire}
                    disabled={calculating}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select male breeder" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-72">
                        {products
                          .filter((product) => product.sex === "Male")
                          .map((product) => (
                            <SelectItem key={product._id} value={product._id}>
                              {product.name} ({product.breed})
                            </SelectItem>
                          ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>

                  {selectedSireProduct && (
                    <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                      <div>
                        <strong>Breed:</strong> {selectedSireProduct.breed}
                      </div>
                      <div>
                        <strong>Age:</strong> {selectedSireProduct.age} years
                      </div>
                      <div>
                        <strong>Price:</strong> $
                        {selectedSireProduct.price?.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-2">
                    Female Breeder (Dam)
                  </label>
                  <Select
                    value={selectedDam}
                    onValueChange={setSelectedDam}
                    disabled={calculating}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select female breeder" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-72">
                        {products
                          .filter((product) => product.sex === "Female")
                          .map((product) => (
                            <SelectItem key={product._id} value={product._id}>
                              {product.name} ({product.breed})
                            </SelectItem>
                          ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>

                  {selectedDamProduct && (
                    <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                      <div>
                        <strong>Breed:</strong> {selectedDamProduct.breed}
                      </div>
                      <div>
                        <strong>Age:</strong> {selectedDamProduct.age} years
                      </div>
                      <div>
                        <strong>Price:</strong> $
                        {selectedDamProduct.price?.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={calculateCompatibility}
                disabled={!selectedSire || !selectedDam || calculating}
                className="w-full h-11"
              >
                {calculating ? (
                  <>Calculating Compatibility...</>
                ) : (
                  <>Calculate Breeding Compatibility</>
                )}
              </Button>

              {compatibility && (
                <div className="space-y-5 mt-6 animate-in fade-in-50 slide-in-from-bottom-5">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Heart
                          className={`h-5 w-5 ${
                            compatibility.score >= 80
                              ? "text-green-500"
                              : compatibility.score >= 60
                              ? "text-yellow-500"
                              : "text-red-500"
                          }`}
                        />
                        Compatibility Score: {compatibility.score}%
                      </h3>
                      <Badge
                        className={getCompatibilityColor(compatibility.score)}
                      >
                        {compatibility.confidenceLevel} Confidence
                      </Badge>
                    </div>

                    <Progress
                      value={compatibility.score}
                      className="h-2.5 w-full"
                      indicatorClassName={getProgressColor(compatibility.score)}
                    />

                    <p className="text-sm opacity-80">
                      {compatibility.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border border-muted bg-muted/30">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm">
                          Contributing Factors
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <ul className="space-y-1.5">
                          {compatibility.factors.map((factor, i) => (
                            <li
                              key={i}
                              className="text-sm flex items-start gap-2"
                            >
                              <Star className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border border-muted bg-muted/30">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          Health Considerations
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                Potential health risks for offspring
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        {compatibility.healthRisks &&
                        compatibility.healthRisks.length > 0 ? (
                          <ul className="space-y-1.5">
                            {compatibility.healthRisks.map((risk, i) => (
                              <li
                                key={i}
                                className="text-sm flex items-start gap-2"
                              >
                                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                {risk}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm flex items-start gap-2">
                            <Star className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            No significant health risks identified
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 flex justify-between text-xs text-muted-foreground">
        <div>Results based on genetic analysis and breeding data</div>
        <div>Updated: {new Date().toLocaleDateString()}</div>
      </CardFooter>
    </Card>
  );
};

export default ProductBreedingCalculator;

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronRight,
  Dna,
  Heart,
  Info,
  Loader2,
  Star,
  X,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import breedingService from "@/services/breedingService";

const BreedingCalculator = ({ onCalculate }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pairLoading, setPairLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [breed1, setBreed1] = useState("");
  const [breed2, setBreed2] = useState("");
  const [breeds, setBreeds] = useState([]);
  const [result, setResult] = useState(null);
  const [recentCalculations, setRecentCalculations] = useState([]);

  useEffect(() => {
    loadBreeds();
    loadRecentCalculations();
  }, [category]);

  const loadBreeds = async () => {
    if (!category) return;
    try {
      const breedsData = await breedingService.getBreedsByCategory(category);
      setBreeds(breedsData);
    } catch (error) {
      console.error("Error loading breeds:", error);
      toast({
        title: "Error",
        description: "Failed to load breeds. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadRecentCalculations = async () => {
    try {
      const calculations = await breedingService.getRecentCalculations();
      setRecentCalculations(calculations);
    } catch (error) {
      console.error("Error loading recent calculations:", error);
    }
  };

  const handleCalculate = async () => {
    if (!breed1 || !breed2) {
      toast({
        title: "Error",
        description: "Please select both breeds to calculate compatibility.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const compatibility =
        await breedingService.calculateBreedingCompatibility(
          breed1,
          breed2,
          category
        );
      setResult(compatibility);
      setStep(3);

      if (onCalculate) {
        onCalculate();
      }

      toast({
        title: "Success",
        description: `Calculated compatibility between ${breed1} and ${breed2}`,
      });
    } catch (error) {
      console.error("Error calculating compatibility:", error);
      toast({
        title: "Error",
        description: "Failed to calculate compatibility. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePair = async () => {
    if (!breed1 || !breed2) {
      toast({
        title: "Error",
        description:
          "Please select both breeds before creating a breeding pair.",
        variant: "destructive",
      });
      return;
    }

    try {
      setPairLoading(true);
      const pairData = {
        sire: breed1,
        dam: breed2,
        startDate: new Date().toISOString(),
        status: "planning",
        notes: `${breed1} × ${breed2} compatibility: ${result.score}%`,
        score: result.score, // Add the compatibility score
      };

      const newPair = await breedingService.createBreedingPair(pairData);

      toast({
        title: "Success",
        description: `Created new breeding pair: ${breed1} × ${breed2}`,
      });

      // Reset after successful creation
      resetCalculator();
    } catch (error) {
      console.error("Error creating breeding pair:", error);
      toast({
        title: "Error",
        description: "Failed to create breeding pair. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPairLoading(false);
    }
  };

  const resetCalculator = () => {
    setStep(1);
    setCategory("");
    setBreed1("");
    setBreed2("");
    setResult(null);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center border-2",
              step === s
                ? "border-amber-600 bg-amber-600 text-white"
                : step > s
                ? "border-amber-600 bg-amber-100 text-amber-600"
                : "border-amber-200 text-amber-400"
            )}
          >
            {step > s ? (
              <Check className="h-4 w-4" />
            ) : (
              <span className="text-sm">{s}</span>
            )}
          </div>
          {s < 3 && (
            <div
              className={cn(
                "w-16 h-0.5",
                step > s ? "bg-amber-600" : "bg-amber-200"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderCategorySelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {["Chicken", "Duck", "Turkey"].map((cat) => (
        <Card
          key={cat}
          className={cn(
            "breeding-card cursor-pointer transition-all",
            category === cat.toLowerCase() && "ring-2 ring-amber-500"
          )}
          onClick={() => {
            setCategory(cat.toLowerCase());
            setStep(2);
          }}
        >
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              {cat === "Chicken" && "🐔"}
              {cat === "Duck" && "🦆"}
              {cat === "Turkey" && "🦃"}
            </div>
            <h3 className="font-medium text-lg mb-2 text-amber-900">{cat}</h3>
            <p className="text-sm text-amber-700">
              Calculate breeding compatibility for {cat.toLowerCase()}s
            </p>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );

  const renderBreedSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Label htmlFor="breed1" className="text-amber-900">
            First Breed
          </Label>
          <Select value={breed1} onValueChange={setBreed1}>
            <SelectTrigger className="border-amber-200 focus:ring-amber-500">
              <SelectValue placeholder="Select first breed" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-72">
                {breeds.map((breed) => (
                  <SelectItem key={breed.id} value={breed.name}>
                    {breed.name}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
          {breed1 && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-medium mb-2 text-amber-900">
                {breed1} Characteristics
              </h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2 text-amber-800">
                  <Check className="h-4 w-4 text-green-600" />
                  Known for egg production
                </li>
                <li className="flex items-center gap-2 text-amber-800">
                  <Check className="h-4 w-4 text-green-600" />
                  Friendly temperament
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Label htmlFor="breed2" className="text-amber-900">
            Second Breed
          </Label>
          <Select value={breed2} onValueChange={setBreed2}>
            <SelectTrigger className="border-amber-200 focus:ring-amber-500">
              <SelectValue placeholder="Select second breed" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-72">
                {breeds.map((breed) => (
                  <SelectItem key={breed.id} value={breed.name}>
                    {breed.name}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
          {breed2 && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-medium mb-2 text-amber-900">
                {breed2} Characteristics
              </h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2 text-amber-800">
                  <Check className="h-4 w-4 text-green-600" />
                  Excellent meat quality
                </li>
                <li className="flex items-center gap-2 text-amber-800">
                  <Check className="h-4 w-4 text-green-600" />
                  Fast growth rate
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => setStep(1)}
          className="breeding-secondary-button"
        >
          Back
        </Button>
        <Button
          onClick={handleCalculate}
          disabled={!breed1 || !breed2 || loading}
          className="breeding-action-button"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              Calculate Compatibility
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );

  const renderResult = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                {breed1} × {breed2}
              </CardTitle>
              <CardDescription>Breeding Compatibility Results</CardDescription>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {result.score}%
              </div>
              <div className="text-sm text-muted-foreground">
                Compatibility Score
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Genetic Compatibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Progress value={result.geneticScore} className="w-2/3" />
                  <span className="text-sm font-medium">
                    {result.geneticScore}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Health Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Progress value={result.healthScore} className="w-2/3" />
                  <span className="text-sm font-medium">
                    {result.healthScore}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Breeding Success
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Progress value={result.successScore} className="w-2/3" />
                  <span className="text-sm font-medium">
                    {result.successScore}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Expected Traits</h3>
              <div className="space-y-2">
                {Object.entries(result.expectedTraits).map(([trait, value]) => (
                  <div
                    key={trait}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <span className="text-sm capitalize">
                      {trait.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <Badge variant="outline">{value}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Breeding Considerations</h3>
              <div className="space-y-2">
                {result.breedingConsiderations.map((consideration, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 bg-muted rounded"
                  >
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{consideration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={resetCalculator}>
            New Calculation
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleCreatePair} disabled={pairLoading}>
                  {pairLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Heart className="mr-2 h-4 w-4" />
                  )}
                  Create Breeding Pair
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create a new breeding pair with these breeds</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Calculations</CardTitle>
          <CardDescription>
            View your recent breeding compatibility calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {recentCalculations.map((calc, index) => (
                <motion.div
                  key={calc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 hover:bg-accent rounded-lg cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Dna className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {calc.breed1} × {calc.breed2}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(calc.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={calc.score >= 80 ? "success" : "warning"}>
                    {calc.score}%
                  </Badge>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {renderStepIndicator()}

      <AnimatePresence mode="wait">
        {step === 1 && renderCategorySelection()}
        {step === 2 && renderBreedSelection()}
        {step === 3 && renderResult()}
      </AnimatePresence>
    </div>
  );
};

export default BreedingCalculator;

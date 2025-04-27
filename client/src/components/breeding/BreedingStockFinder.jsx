import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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
import { Checkbox } from "@/components/ui/checkbox";
import { SearchIcon, Filter, ArrowRight } from "lucide-react";

const BreedingStockFinder = () => {
  const navigate = useNavigate();
  const [breedingGoal, setBreedingGoal] = useState("");
  const [poultryType, setPoultryType] = useState("");
  const [breedPreference, setBreedPreference] = useState("");
  const [traits, setTraits] = useState({
    eggProduction: false,
    meatProduction: false,
    temperament: false,
    hardiness: false,
    broodiness: false,
    exhibition: false,
  });

  const handleTraitChange = (trait) => {
    setTraits((prev) => ({
      ...prev,
      [trait]: !prev[trait],
    }));
  };

  const handleSearch = () => {
    // Construct search query
    const queryParams = new URLSearchParams();

    if (poultryType) {
      queryParams.append("category", poultryType.toLowerCase());
    }

    if (breedPreference) {
      queryParams.append("breed", breedPreference);
    }

    // Add traits as tags
    const selectedTraits = Object.entries(traits)
      .filter(([_, selected]) => selected)
      .map(([trait]) => trait);

    if (selectedTraits.length > 0) {
      queryParams.append("traits", selectedTraits.join(","));
    }

    // Add breeding goal as a search keyword
    if (breedingGoal) {
      queryParams.append("purpose", breedingGoal);
    }

    // Add breeding tag
    queryParams.append("forBreeding", "true");

    // Navigate to products page with search filters
    navigate(`/products?${queryParams.toString()}`);
  };

  return (
    <Card className="shadow-md border-[#ffb464]/30">
      <CardHeader className="bg-gradient-to-r from-[#fff5e8] to-[#ffeed7]">
        <CardTitle className="text-[#a05e2b]">Breeding Stock Finder</CardTitle>
        <CardDescription className="text-[#b06a30]">
          Find the perfect birds for your breeding program
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="breeding-goal" className="text-[#a05e2b]">
            What's your breeding goal?
          </Label>
          <Select value={breedingGoal} onValueChange={setBreedingGoal}>
            <SelectTrigger
              id="breeding-goal"
              className="border-[#ffb464]/30 focus:ring-[#ffb464]"
            >
              <SelectValue placeholder="Select your breeding goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eggs">Improved Egg Production</SelectItem>
              <SelectItem value="meat">Better Meat Quality</SelectItem>
              <SelectItem value="dual">Dual Purpose Breeds</SelectItem>
              <SelectItem value="exhibition">
                Exhibition/Show Quality
              </SelectItem>
              <SelectItem value="heritage">
                Heritage Breed Preservation
              </SelectItem>
              <SelectItem value="sustainability">
                Sustainable Farming
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="poultry-type" className="text-[#a05e2b]">
              Type of Poultry
            </Label>
            <Select value={poultryType} onValueChange={setPoultryType}>
              <SelectTrigger
                id="poultry-type"
                className="border-[#ffb464]/30 focus:ring-[#ffb464]"
              >
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chicken">Chickens</SelectItem>
                <SelectItem value="duck">Ducks</SelectItem>
                <SelectItem value="turkey">Turkeys</SelectItem>
                <SelectItem value="other">Other Poultry</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="breed-preference" className="text-[#a05e2b]">
              Breed Preference (Optional)
            </Label>
            <Input
              id="breed-preference"
              value={breedPreference}
              onChange={(e) => setBreedPreference(e.target.value)}
              placeholder="E.g., Rhode Island Red"
              className="border-[#ffb464]/30 focus:ring-[#ffb464]"
            />
          </div>
        </div>

        <div>
          <Label className="text-[#a05e2b]">Important Traits</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="egg-production"
                checked={traits.eggProduction}
                onCheckedChange={() => handleTraitChange("eggProduction")}
                className="border-[#ffb464] data-[state=checked]:bg-[#ffb464] data-[state=checked]:text-white"
              />
              <label
                htmlFor="egg-production"
                className="text-sm text-[#b06a30] cursor-pointer"
              >
                High Egg Production
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="meat-production"
                checked={traits.meatProduction}
                onCheckedChange={() => handleTraitChange("meatProduction")}
                className="border-[#ffb464] data-[state=checked]:bg-[#ffb464] data-[state=checked]:text-white"
              />
              <label
                htmlFor="meat-production"
                className="text-sm text-[#b06a30] cursor-pointer"
              >
                Meat Quality
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="temperament"
                checked={traits.temperament}
                onCheckedChange={() => handleTraitChange("temperament")}
                className="border-[#ffb464] data-[state=checked]:bg-[#ffb464] data-[state=checked]:text-white"
              />
              <label
                htmlFor="temperament"
                className="text-sm text-[#b06a30] cursor-pointer"
              >
                Docile Temperament
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hardiness"
                checked={traits.hardiness}
                onCheckedChange={() => handleTraitChange("hardiness")}
                className="border-[#ffb464] data-[state=checked]:bg-[#ffb464] data-[state=checked]:text-white"
              />
              <label
                htmlFor="hardiness"
                className="text-sm text-[#b06a30] cursor-pointer"
              >
                Cold Hardiness
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="broodiness"
                checked={traits.broodiness}
                onCheckedChange={() => handleTraitChange("broodiness")}
                className="border-[#ffb464] data-[state=checked]:bg-[#ffb464] data-[state=checked]:text-white"
              />
              <label
                htmlFor="broodiness"
                className="text-sm text-[#b06a30] cursor-pointer"
              >
                Good Broodiness
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="exhibition"
                checked={traits.exhibition}
                onCheckedChange={() => handleTraitChange("exhibition")}
                className="border-[#ffb464] data-[state=checked]:bg-[#ffb464] data-[state=checked]:text-white"
              />
              <label
                htmlFor="exhibition"
                className="text-sm text-[#b06a30] cursor-pointer"
              >
                Exhibition Quality
              </label>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-[#fff5e8]/50">
        <Button
          onClick={handleSearch}
          className="w-full bg-gradient-to-r from-[#ffb464] to-[#ffa040] hover:from-[#ffa040] hover:to-[#ff9428] text-white transition-all"
        >
          <SearchIcon className="mr-2 h-4 w-4" /> Find Breeding Stock
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BreedingStockFinder;

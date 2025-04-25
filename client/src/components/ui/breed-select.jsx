import React, { useState, useEffect } from "react";
import { breedDatabase, breedCombinations } from "@/data/breedDatabase";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Egg, Scale, Thermometer, Users } from "lucide-react";

const BreedSelect = ({ category, value, onValueChange, className }) => {
  const [breeds, setBreeds] = useState([]);
  const [combinations, setCombinations] = useState([]);
  const [openHoverId, setOpenHoverId] = useState(null);

  useEffect(() => {
    // Filter breeds based on category
    const filteredBreeds = Object.entries(breedDatabase)
      .filter(([_, data]) => {
        if (category === "chicken") {
          return (
            data.category === "Pure Breed" ||
            (data.category === "Hybrid/Crossbreed" &&
              !data.parentage?.male?.toLowerCase().includes("duck") &&
              !data.parentage?.male?.toLowerCase().includes("turkey"))
          );
        }
        if (category === "duck") {
          return (
            data.parentage?.male?.toLowerCase().includes("duck") ||
            data.description?.toLowerCase().includes("duck")
          );
        }
        if (category === "turkey") {
          return (
            data.parentage?.male?.toLowerCase().includes("turkey") ||
            data.description?.toLowerCase().includes("turkey")
          );
        }
        return false;
      })
      .map(([name]) => name);

    setBreeds(filteredBreeds);

    // Filter relevant breed combinations
    const relevantCombinations = Object.entries(breedCombinations)
      .filter(([key]) => {
        if (category === "chicken") {
          return (
            !key.toLowerCase().includes("duck") &&
            !key.toLowerCase().includes("turkey")
          );
        }
        return key.toLowerCase().includes(category);
      })
      .map(([key, value]) => ({ key, ...value }));

    setCombinations(relevantCombinations);
  }, [category]);

  const getBreedInfo = (breedName) => {
    const info = breedDatabase[breedName];
    if (!info) return null;

    return (
      <div className="space-y-4">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="production" className="flex items-center gap-2">
              <Egg className="h-4 w-4" />
              Production
            </TabsTrigger>
            <TabsTrigger value="physical" className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Physical
            </TabsTrigger>
            <TabsTrigger value="care" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Care
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-2">
            <h4 className="font-semibold text-lg">{breedName}</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <span className="font-medium">Category:</span> {info.category}
              </div>
              <div>
                <span className="font-medium">Type:</span> {info.type}
              </div>
              {info.origin && (
                <div>
                  <span className="font-medium">Origin:</span> {info.origin}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">{info.description}</p>
            {info.specialNotes && (
              <p className="text-sm text-blue-600">{info.specialNotes}</p>
            )}
          </TabsContent>

          <TabsContent value="production" className="space-y-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <span className="font-medium">Egg Color:</span> {info.eggColor}
              </div>
              <div>
                <span className="font-medium">Production:</span>{" "}
                {info.eggProduction}
              </div>
              {info.weight && (
                <div>
                  <span className="font-medium">Weight:</span> {info.weight}
                </div>
              )}
            </div>
            {info.parentage && (
              <div className="mt-2 text-sm">
                <span className="font-medium">Parentage:</span>
                <ul className="ml-4 list-disc">
                  {info.parentage.male && (
                    <li>Male Line: {info.parentage.male}</li>
                  )}
                  {info.parentage.female && (
                    <li>Female Line: {info.parentage.female}</li>
                  )}
                  {info.parentage.both && (
                    <li>Both Lines: {info.parentage.both}</li>
                  )}
                </ul>
              </div>
            )}
          </TabsContent>

          <TabsContent value="physical" className="space-y-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <span className="font-medium">Temperament:</span>{" "}
                {info.temperament}
              </div>
              <div>
                <span className="font-medium">Climate:</span> {info.climate}
              </div>
              {info.characteristics && (
                <div className="col-span-2">
                  <span className="font-medium">Characteristics:</span>{" "}
                  {info.characteristics}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="care" className="space-y-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {info.broodiness && (
                <div>
                  <span className="font-medium">Broodiness:</span>{" "}
                  {info.broodiness}
                </div>
              )}
              {info.foraging && (
                <div>
                  <span className="font-medium">Foraging:</span> {info.foraging}
                </div>
              )}
              {info.confinement && (
                <div>
                  <span className="font-medium">Confinement:</span>{" "}
                  {info.confinement}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className={className}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select breed" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Pure Breeds</SelectLabel>
            {breeds
              .filter((breed) => breedDatabase[breed].category === "Pure Breed")
              .map((breed) => (
                <HoverCard
                  key={breed}
                  open={openHoverId === breed}
                  onOpenChange={(open) => setOpenHoverId(open ? breed : null)}
                >
                  <HoverCardTrigger asChild>
                    <div className="relative">
                      <SelectItem value={breed} className="pr-8">
                        {breed}
                      </SelectItem>
                      <Info className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-96 z-[100]" side="right">
                    {getBreedInfo(breed)}
                  </HoverCardContent>
                </HoverCard>
              ))}
          </SelectGroup>

          <SelectGroup>
            <SelectLabel>Hybrids & Crossbreeds</SelectLabel>
            {breeds
              .filter(
                (breed) => breedDatabase[breed].category === "Hybrid/Crossbreed"
              )
              .map((breed) => (
                <HoverCard
                  key={breed}
                  open={openHoverId === breed}
                  onOpenChange={(open) => setOpenHoverId(open ? breed : null)}
                >
                  <HoverCardTrigger asChild>
                    <div className="relative">
                      <SelectItem value={breed} className="pr-8">
                        {breed}
                      </SelectItem>
                      <Info className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-96 z-[100]" side="right">
                    {getBreedInfo(breed)}
                  </HoverCardContent>
                </HoverCard>
              ))}
          </SelectGroup>

          {combinations.length > 0 && (
            <SelectGroup>
              <SelectLabel>Common Combinations</SelectLabel>
              {combinations.map(
                ({ key, name, characteristics, expectedTraits }) => (
                  <HoverCard
                    key={key}
                    open={openHoverId === key}
                    onOpenChange={(open) => setOpenHoverId(open ? key : null)}
                  >
                    <HoverCardTrigger asChild>
                      <div className="relative">
                        <SelectItem value={key} className="pr-8">
                          {name || key}
                        </SelectItem>
                        <Info className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 z-[100]" side="right">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{name || key}</h4>
                        <p className="text-sm">{characteristics}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          {Object.entries(expectedTraits).map(
                            ([trait, value]) => (
                              <div key={trait}>
                                <span className="font-medium">
                                  {trait
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                  :
                                </span>{" "}
                                {value}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )
              )}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BreedSelect;

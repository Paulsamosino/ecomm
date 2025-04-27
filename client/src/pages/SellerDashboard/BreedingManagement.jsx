import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, PlusCircle, Info } from "lucide-react";
import { breedDatabase, breedCombinations } from "@/data/breedDatabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const BreedingManagement = () => {
  const [activeTab, setActiveTab] = useState("calculator");
  const [breedingPairs, setBreedingPairs] = useState([]);
  const [breed1, setBreed1] = useState("");
  const [breed2, setBreed2] = useState("");
  const [maleId, setMaleId] = useState("");
  const [femaleId, setFemaleId] = useState("");
  const [date, setDate] = useState(new Date());
  const [breedingResult, setBreedingResult] = useState(null);
  const [notes, setNotes] = useState("");

  // Get pure breeds from database
  const pureBreeds = Object.entries(breedDatabase)
    .filter(([_, data]) => data.category === "Pure Breed")
    .map(([name]) => name);

  const calculateBreedingResult = (breed1, breed2) => {
    if (!breed1 || !breed2) return null;

    const combinationKey = `${breed1} × ${breed2}`;
    const reverseCombinationKey = `${breed2} × ${breed1}`;

    if (breedCombinations[combinationKey]) {
      return {
        ...breedCombinations[combinationKey],
        incubationPeriod: getIncubationPeriod(breed1, breed2),
      };
    } else if (breedCombinations[reverseCombinationKey]) {
      return {
        ...breedCombinations[reverseCombinationKey],
        incubationPeriod: getIncubationPeriod(breed1, breed2),
      };
    }

    const breed1Data = breedDatabase[breed1];
    const breed2Data = breedDatabase[breed2];

    return {
      name: `${breed1}-${breed2} Cross`,
      characteristics: "Custom hybrid cross",
      expectedTraits: {
        eggProduction: calculateAverageEggProduction(breed1Data, breed2Data),
        temperament: "Mixed characteristics",
        meatQuality: "Dependent on parent breeds",
        hybridVigor: "Moderate to High",
      },
      geneticPredictions: {
        dominantTraits: getDominantTraits(breed1Data, breed2Data),
      },
      breedingConsiderations: getBreedingConsiderations(breed1Data, breed2Data),
      incubationPeriod: getIncubationPeriod(breed1, breed2),
    };
  };

  const getIncubationPeriod = (breed1, breed2) => {
    const breed1Data = breedDatabase[breed1];
    const breed2Data = breedDatabase[breed2];
    // Default chicken incubation period if not specified
    return 21;
  };

  const calculateAverageEggProduction = (breed1Data, breed2Data) => {
    if (!breed1Data?.eggProduction || !breed2Data?.eggProduction)
      return "Variable";

    const getAverageFromRange = (range) => {
      const numbers = range.match(/\d+/g);
      if (!numbers || numbers.length < 2) return null;
      return (parseInt(numbers[0]) + parseInt(numbers[1])) / 2;
    };

    const avg1 = getAverageFromRange(breed1Data.eggProduction);
    const avg2 = getAverageFromRange(breed2Data.eggProduction);

    if (!avg1 || !avg2) return "Variable";
    return `${Math.round((avg1 + avg2) / 2)} eggs per year (estimated)`;
  };

  const getDominantTraits = (breed1Data, breed2Data) => {
    const traits = [];
    if (breed1Data?.geneticMarkers?.featherColor) {
      traits.push(
        `${breed1Data.geneticMarkers.featherColor} feathering possible`
      );
    }
    if (breed2Data?.geneticMarkers?.featherColor) {
      traits.push(
        `${breed2Data.geneticMarkers.featherColor} feathering possible`
      );
    }
    return traits.length > 0
      ? traits
      : ["Traits may vary", "Expect hybrid vigor"];
  };

  const getBreedingConsiderations = (breed1Data, breed2Data) => {
    const considerations = [];
    if (breed1Data?.climate && breed2Data?.climate) {
      considerations.push(
        `Climate adaptability: ${breed1Data.climate} × ${breed2Data.climate}`
      );
    }
    if (breed1Data?.broodiness && breed2Data?.broodiness) {
      considerations.push(
        `Broodiness potential: ${breed1Data.broodiness} × ${breed2Data.broodiness}`
      );
    }
    return considerations.length > 0
      ? considerations
      : ["Monitor offspring characteristics"];
  };

  const handleBreedChange = (breed, setter) => {
    setter(breed);
    if (breed1 && breed2) {
      const result = calculateBreedingResult(breed1, breed2);
      setBreedingResult(result);
    }
  };

  const handleAddPair = () => {
    if (breed1 && breed2 && maleId && femaleId && date) {
      const result = calculateBreedingResult(breed1, breed2);
      const newPair = {
        id: Date.now(),
        breed1,
        breed2,
        maleId,
        femaleId,
        breedingDate: date,
        expectedHatchDate: new Date(
          date.getTime() + result.incubationPeriod * 24 * 60 * 60 * 1000
        ),
        result,
        notes,
        status: "Active",
      };
      setBreedingPairs([...breedingPairs, newPair]);

      // Reset form
      setBreed1("");
      setBreed2("");
      setMaleId("");
      setFemaleId("");
      setNotes("");
      setDate(new Date());
      setBreedingResult(null);
    }
  };

  const updatePairStatus = (id, newStatus) => {
    setBreedingPairs(
      breedingPairs.map((pair) =>
        pair.id === id ? { ...pair, status: newStatus } : pair
      )
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-[#d37b33] to-[#ffb464] text-transparent bg-clip-text">
        Breeding Management
      </h1>

      <Tabs
        defaultValue="calculator"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-[#fff5e8] to-[#ffeed7] p-1 rounded-xl">
          <TabsTrigger
            value="calculator"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#ffb464] data-[state=active]:to-[#ffa040] data-[state=active]:text-white transition-all"
          >
            Breeding Calculator
          </TabsTrigger>
          <TabsTrigger
            value="management"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#ffb464] data-[state=active]:to-[#ffa040] data-[state=active]:text-white transition-all"
          >
            Breeding Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-4">
          <Card className="shadow-md border-[#ffb464]/30">
            <CardHeader className="bg-gradient-to-r from-[#fff5e8] to-[#ffeed7]">
              <CardTitle className="text-[#a05e2b]">
                Breeding Calculator
              </CardTitle>
              <CardDescription className="text-[#b06a30]">
                Calculate breeding outcomes and predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="breed1" className="text-[#a05e2b]">
                      First Breed
                    </Label>
                    <Select
                      value={breed1}
                      onValueChange={(value) =>
                        handleBreedChange(value, setBreed1)
                      }
                    >
                      <SelectTrigger className="border-[#ffb464]/30 focus:ring-[#ffb464]">
                        <SelectValue placeholder="Select first breed" />
                      </SelectTrigger>
                      <SelectContent>
                        {pureBreeds.map((breed) => (
                          <SelectItem key={breed} value={breed}>
                            {breed}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="breed2" className="text-[#a05e2b]">
                      Second Breed
                    </Label>
                    <Select
                      value={breed2}
                      onValueChange={(value) =>
                        handleBreedChange(value, setBreed2)
                      }
                    >
                      <SelectTrigger className="border-[#ffb464]/30 focus:ring-[#ffb464]">
                        <SelectValue placeholder="Select second breed" />
                      </SelectTrigger>
                      <SelectContent>
                        {pureBreeds.map((breed) => (
                          <SelectItem key={breed} value={breed}>
                            {breed}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {breedingResult && (
                  <Card className="mt-4 border-[#ffb464]/30 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-[#fff5e8] to-[#ffeed7]">
                      <CardTitle className="text-lg text-[#a05e2b]">
                        {breedingResult.name}
                      </CardTitle>
                      <CardDescription className="text-[#b06a30]">
                        {breedingResult.characteristics}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2 text-[#a05e2b]">
                          Expected Traits
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(breedingResult.expectedTraits).map(
                            ([trait, value]) => (
                              <div
                                key={trait}
                                className="flex items-start space-x-2"
                              >
                                <div className="w-full p-2 rounded-md bg-gradient-to-r from-[#fff5e8] to-[#ffeed7]">
                                  <p className="font-medium capitalize text-[#a05e2b]">
                                    {trait}
                                  </p>
                                  <p className="text-sm text-[#b06a30]">
                                    {value}
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2 text-[#a05e2b]">
                          Breeding Considerations
                        </h4>
                        <ul className="list-disc list-inside space-y-1">
                          {breedingResult.breedingConsiderations.map(
                            (consideration, index) => (
                              <li
                                key={index}
                                className="text-sm text-[#b06a30]"
                              >
                                {consideration}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maleId" className="text-[#a05e2b]">
                      Male ID
                    </Label>
                    <Input
                      id="maleId"
                      value={maleId}
                      onChange={(e) => setMaleId(e.target.value)}
                      placeholder="Enter male ID"
                      className="border-[#ffb464]/30 focus:ring-[#ffb464]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="femaleId" className="text-[#a05e2b]">
                      Female ID
                    </Label>
                    <Input
                      id="femaleId"
                      value={femaleId}
                      onChange={(e) => setFemaleId(e.target.value)}
                      placeholder="Enter female ID"
                      className="border-[#ffb464]/30 focus:ring-[#ffb464]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#a05e2b]">Breeding Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal border-[#ffb464]/30",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-[#ffb464]" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        className="text-[#a05e2b]"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-[#a05e2b]">
                    Notes
                  </Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add breeding notes"
                    className="border-[#ffb464]/30 focus:ring-[#ffb464]"
                  />
                </div>

                <Button
                  onClick={handleAddPair}
                  disabled={!breed1 || !breed2 || !maleId || !femaleId || !date}
                  className="w-full bg-gradient-to-r from-[#ffb464] to-[#ffa040] hover:from-[#ffa040] hover:to-[#ff9428] text-white transition-all"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Breeding Pair
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <Card className="shadow-md border-[#ffb464]/30">
            <CardHeader className="bg-gradient-to-r from-[#fff5e8] to-[#ffeed7]">
              <CardTitle className="text-[#a05e2b]">
                Active Breeding Pairs
              </CardTitle>
              <CardDescription className="text-[#b06a30]">
                Manage your current breeding pairs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-[#fff5e8]">
                  <TableRow>
                    <TableHead className="text-[#a05e2b]">Breeds</TableHead>
                    <TableHead className="text-[#a05e2b]">IDs</TableHead>
                    <TableHead className="text-[#a05e2b]">
                      Breeding Date
                    </TableHead>
                    <TableHead className="text-[#a05e2b]">
                      Expected Hatch
                    </TableHead>
                    <TableHead className="text-[#a05e2b]">Status</TableHead>
                    <TableHead className="text-[#a05e2b]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breedingPairs.map((pair) => (
                    <TableRow key={pair.id} className="hover:bg-[#fff5e8]/50">
                      <TableCell>
                        <div className="font-medium text-[#a05e2b]">
                          {pair.result.name}
                        </div>
                        <div className="text-sm text-[#b06a30]">
                          {pair.breed1} × {pair.breed2}
                        </div>
                      </TableCell>
                      <TableCell className="text-[#b06a30]">
                        <div>♂ {pair.maleId}</div>
                        <div>♀ {pair.femaleId}</div>
                      </TableCell>
                      <TableCell className="text-[#b06a30]">
                        {format(pair.breedingDate, "PP")}
                      </TableCell>
                      <TableCell className="text-[#b06a30]">
                        {format(pair.expectedHatchDate, "PP")}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={pair.status}
                          onValueChange={(value) =>
                            updatePairStatus(pair.id, value)
                          }
                        >
                          <SelectTrigger className="w-[120px] border-[#ffb464]/30 focus:ring-[#ffb464]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Hatched">Hatched</SelectItem>
                            <SelectItem value="Failed">Failed</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setBreedingResult(pair.result)}
                          className="text-[#ffb464] hover:text-[#a05e2b] hover:bg-[#fff5e8]"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {breedingPairs.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-[#b06a30] h-32"
                      >
                        No breeding pairs added yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BreedingManagement;

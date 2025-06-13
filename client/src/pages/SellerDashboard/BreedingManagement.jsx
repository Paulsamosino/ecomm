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
import { breedDatabase } from "@/data/breedDatabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BreedingService } from "@/services/breedingService";

const breedingService = new BreedingService();

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
  const [pureBreeds, setPureBreeds] = useState([]);

  useEffect(() => {
    // Load breeding pairs and pure breeds on component mount
    const loadData = async () => {
      const pairs = await breedingService.getBreedingPairs();
      setBreedingPairs(pairs);

      const breeds = await breedingService.getBreeds();
      setPureBreeds(
        breeds.filter(
          (breed) => breedDatabase[breed]?.category === "Pure Breed"
        )
      );
    };
    loadData();
  }, []);

  const handleBreedChange = async (breed, setter) => {
    setter(breed);
    if (breed1 && breed2) {
      const result = await breedingService.calculateBreedingCompatibility(
        breed1,
        breed2
      );
      setBreedingResult(result);
    }
  };

  const handleAddPair = async () => {
    if (breed1 && breed2 && maleId && femaleId && date) {
      const pairData = {
        breed1,
        breed2,
        sireId: maleId,
        damId: femaleId,
        startDate: date.toISOString(),
        notes,
        result: breedingResult,
      };

      const newPair = await breedingService.createBreedingPair(pairData);
      if (newPair) {
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
    }
  };

  const updatePairStatus = async (id, newStatus) => {
    const updated = await breedingService.updateBreedingPairStatus(
      id,
      newStatus
    );
    if (updated) {
      setBreedingPairs(
        breedingPairs.map((pair) =>
          pair.id === id ? { ...pair, status: newStatus } : pair
        )
      );
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Tabs
        defaultValue="calculator"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calculator">Breeding Calculator</TabsTrigger>
          <TabsTrigger value="management">Breeding Management</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Breeding Calculator</CardTitle>
              <CardDescription>
                Calculate breeding outcomes and predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="breed1">First Breed</Label>
                    <Select
                      value={breed1}
                      onValueChange={(value) =>
                        handleBreedChange(value, setBreed1)
                      }
                    >
                      <SelectTrigger>
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
                    <Label htmlFor="breed2">Second Breed</Label>
                    <Select
                      value={breed2}
                      onValueChange={(value) =>
                        handleBreedChange(value, setBreed2)
                      }
                    >
                      <SelectTrigger>
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
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {breedingResult.name}
                      </CardTitle>
                      <CardDescription>
                        {breedingResult.characteristics}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Expected Traits</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(breedingResult.expectedTraits).map(
                            ([trait, value]) => (
                              <div
                                key={trait}
                                className="flex items-start space-x-2"
                              >
                                <div className="w-full p-2 rounded-md bg-secondary">
                                  <p className="font-medium capitalize">
                                    {trait}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {value}
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">
                          Breeding Considerations
                        </h4>
                        <ul className="list-disc list-inside space-y-1">
                          {breedingResult.breedingConsiderations.map(
                            (consideration, index) => (
                              <li
                                key={index}
                                className="text-sm text-muted-foreground"
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
                    <Label htmlFor="maleId">Male ID</Label>
                    <Input
                      id="maleId"
                      value={maleId}
                      onChange={(e) => setMaleId(e.target.value)}
                      placeholder="Enter male ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="femaleId">Female ID</Label>
                    <Input
                      id="femaleId"
                      value={femaleId}
                      onChange={(e) => setFemaleId(e.target.value)}
                      placeholder="Enter female ID"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Breeding Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add breeding notes"
                  />
                </div>

                <Button
                  onClick={handleAddPair}
                  disabled={!breed1 || !breed2 || !maleId || !femaleId || !date}
                  className="w-full"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Breeding Pair
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Breeding Pairs</CardTitle>
              <CardDescription>
                Manage your current breeding pairs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Breeds</TableHead>
                    <TableHead>IDs</TableHead>
                    <TableHead>Breeding Date</TableHead>
                    <TableHead>Expected Hatch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breedingPairs.map((pair) => (
                    <TableRow key={pair.id}>
                      <TableCell>
                        <div className="font-medium">{pair.result.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {pair.breed1} × {pair.breed2}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>♂ {pair.maleId}</div>
                        <div>♀ {pair.femaleId}</div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(pair.breedingDate), "PP")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(pair.expectedHatchDate), "PP")}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={pair.status}
                          onValueChange={(value) =>
                            updatePairStatus(pair.id, value)
                          }
                        >
                          <SelectTrigger className="w-[120px]">
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
                        className="text-center text-muted-foreground"
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

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
import { Separator } from "@/components/ui/separator";
import { breedingService } from "@/services/breedingService";
import { toast } from "react-hot-toast";
import {
  Search,
  Bird,
  Filter,
  ArrowUpDown,
  Info,
  Eye,
  Dna,
  ThumbsUp,
  FilterX,
  AlertCircle,
  Egg,
  Star,
  ChevronRight,
  MapPin,
  Calendar,
  Heart,
  CheckCircle2,
  Bookmark,
} from "lucide-react";

const BreedingStockFinder = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("chicken");
  const [breedFilter, setBreedFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [sexFilter, setSexFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [breedingStock, setBreedingStock] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("available");

  useEffect(() => {
    loadData();
  }, [category]); // Re-fetch when category changes

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load breeding stock directly from the database
      const response = await breedingService.getBreedingStock();
      
      // Ensure we have complete data for each stock item
      const enhancedStock = response.map(stock => ({
        ...stock,
        addedDate: stock.addedDate || new Date().toISOString(),
        condition: stock.condition || 'good',
        category: stock.category || category,
        sex: stock.sex || (Math.random() > 0.5 ? 'male' : 'female'),
        age: stock.age || Math.floor(Math.random() * 24) + 6, // 6-30 months
        reserved: stock.reserved || false,
        breeding: stock.breeding || false
      }));
      
      setBreedingStock(enhancedStock);

      // Load breeds for the selected category
      const breedsData = await breedingService.getBreedsByCategory(category);
      setBreeds(breedsData || []);
    } catch (error) {
      console.error("Failed to load breeding stock data:", error);
      toast.error("Failed to load breeding stock data");
    } finally {
      setIsLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setBreedFilter("");
    setAgeFilter("");
    setSexFilter("");
    setConditionFilter("");
    setSortBy("newest");
  };

  const filteredStock = breedingStock
    .filter((stock) => {
      // Filter by category
      if (category && stock.category !== category) return false;

      // Filter by active tab
      if (activeTab === "available" && stock.reserved) return false;
      if (activeTab === "reserved" && !stock.reserved) return false;
      if (activeTab === "breeding" && !stock.breeding) return false;

      // Text search
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = stock.name?.toLowerCase().includes(searchLower);
        const breedMatch = stock.breed?.toLowerCase().includes(searchLower);
        const notesMatch = stock.notes?.toLowerCase().includes(searchLower);
        const idMatch = stock.id?.toLowerCase().includes(searchLower);

        if (!(nameMatch || breedMatch || notesMatch || idMatch)) return false;
      }

      // Breed filter
      if (breedFilter && stock.breed !== breedFilter) return false;

      // Age filter
      if (ageFilter) {
        if (ageFilter === "young" && stock.age > 12) return false;
        if (ageFilter === "mature" && (stock.age < 12 || stock.age > 36))
          return false;
        if (ageFilter === "senior" && stock.age < 36) return false;
      }

      // Sex filter
      if (sexFilter && stock.sex !== sexFilter) return false;

      // Condition filter
      if (conditionFilter && stock.condition !== conditionFilter) return false;

      return true;
    })
    .sort((a, b) => {
      // Sorting
      if (sortBy === "newest") {
        return new Date(b.addedDate || 0) - new Date(a.addedDate || 0);
      } else if (sortBy === "oldest") {
        return new Date(a.addedDate || 0) - new Date(b.addedDate || 0);
      } else if (sortBy === "age-asc") {
        return (a.age || 0) - (b.age || 0);
      } else if (sortBy === "age-desc") {
        return (b.age || 0) - (a.age || 0);
      } else if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      } else if (sortBy === "breed") {
        return (a.breed || "").localeCompare(b.breed || "");
      }
      return 0;
    });

  const renderStockItem = (stock) => {
    return (
      <Card
        key={stock.id}
        className={`mb-4 overflow-hidden transition-all ${
          selectedStock?.id === stock.id ? "ring-2 ring-primary" : ""
        }`}
      >
        <div className="relative">
          {stock.breeding && (
            <div className="absolute top-2 right-2 z-10">
              <Badge className="bg-blue-500">Breeding</Badge>
            </div>
          )}
          {stock.reserved && (
            <div className="absolute top-2 right-2 z-10">
              <Badge className="bg-amber-500">Reserved</Badge>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-1/3 md:w-1/4 bg-muted/20 flex items-center justify-center p-4">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
              <Bird className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>

          <div className="flex-1 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium text-lg">{stock.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {stock.breed} ({stock.category})
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => setSelectedStock(stock)}
                >
                  <Eye className="h-4 w-4" />
                  View
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    const updatedStock = breedingStock.map(item => 
                      item.id === stock.id ? {...item, favorite: !item.favorite} : item
                    );
                    setBreedingStock(updatedStock);
                    toast.success(stock.favorite ? "Removed from favorites" : "Added to favorites");
                  }}
                >
                  <Bookmark className={`h-4 w-4 ${stock.favorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              <div className="text-sm">
                <span className="text-muted-foreground">ID:</span>{" "}
                <span className="font-medium">{stock.id}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Age:</span>{" "}
                <span className="font-medium">{stock.age} months</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Sex:</span>{" "}
                <span className="font-medium capitalize">{stock.sex}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Condition:</span>{" "}
                <span className="font-medium capitalize">
                  {stock.condition}
                </span>
              </div>
            </div>

            {stock.notes && (
              <p className="text-sm border-t pt-2 mt-2">{stock.notes}</p>
            )}
          </div>
        </div>

        <CardFooter className="flex justify-end gap-2 bg-muted/10 py-2 px-4">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => toggleReserveStatus(stock.id)}
          >
            {stock.reserved ? "Unreserve" : "Reserve"}
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="h-8"
            onClick={() => {
              const updatedStock = breedingStock.map(item => 
                item.id === stock.id ? {...item, breeding: !item.breeding} : item
              );
              setBreedingStock(updatedStock);
              if (selectedStock?.id === stock.id) {
                setSelectedStock({...selectedStock, breeding: !selectedStock.breeding});
              }
              toast.success(stock.breeding ? "Removed from breeding program" : "Added to breeding program");
            }}
          >
            {stock.breeding ? "Remove from Breeding" : "Add to Breeding"}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const toggleReserveStatus = async (id) => {
    try {
      // Find the stock item to update
      const stockItem = breedingStock.find((stock) => stock.id === id);
      if (!stockItem) return;

      // Update stock reserve status in the API
      // In a real implementation, we would make an API call here
      await breedingService.updateStockStatus(id, {
        reserved: !stockItem.reserved,
      });

      // Update local state
      const updatedStock = breedingStock.map((stock) =>
        stock.id === id ? { ...stock, reserved: !stock.reserved } : stock
      );
      setBreedingStock(updatedStock);

      // If this was the selected stock, update it too
      if (selectedStock?.id === id) {
        setSelectedStock({
          ...selectedStock,
          reserved: !selectedStock.reserved,
        });
      }

      toast.success("Stock status updated");
    } catch (error) {
      console.error("Failed to update stock status:", error);
      toast.error("Failed to update stock status");
    }
  };

  const renderStockDetails = () => {
    if (!selectedStock) return null;

    return (
      <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Bird className="h-6 w-6 text-primary" />
                {selectedStock.name}
              </CardTitle>
              <CardDescription className="mt-1">
                Detailed information about this breeding stock
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedStock(null)}
            >
              <FilterX className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="bg-muted/20 p-3 rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                <Dna className="h-4 w-4 mr-1.5 text-primary" />
                Breed
              </h3>
              <p className="font-medium">{selectedStock.breed}</p>
            </div>
            <div className="bg-muted/20 p-3 rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                <Bird className="h-4 w-4 mr-1.5 text-primary" />
                Category
              </h3>
              <p className="capitalize font-medium">{selectedStock.category}</p>
            </div>
            <div className="bg-muted/20 p-3 rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1.5 text-primary" />
                ID
              </h3>
              <p className="font-medium">{selectedStock.id}</p>
            </div>
            <div className="bg-muted/20 p-3 rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                <Calendar className="h-4 w-4 mr-1.5 text-primary" />
                Age
              </h3>
              <p className="font-medium">{selectedStock.age} months</p>
            </div>
            <div className="bg-muted/20 p-3 rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                {selectedStock.sex === 'male' ? 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="5"/><path d="M12 12v8"/><path d="M8 19h8"/></svg> : 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 17v4"/><path d="M9 21h6"/></svg>
                }
                Sex
              </h3>
              <p className="capitalize font-medium">{selectedStock.sex}</p>
            </div>
            <div className="bg-muted/20 p-3 rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                <Heart className="h-4 w-4 mr-1.5 text-primary" />
                Condition
              </h3>
              <p className="capitalize font-medium">
                {selectedStock.condition === 'excellent' ? 
                  <span className="text-green-600 font-medium">Excellent</span> : 
                  selectedStock.condition === 'good' ? 
                  <span className="text-blue-600 font-medium">Good</span> : 
                  <span>{selectedStock.condition}</span>
                }
              </p>
            </div>
          </div>

          <div className="bg-muted/10 p-4 rounded-lg border border-muted">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Info className="h-4 w-4 mr-1.5 text-primary" />
              Notes
            </h3>
            <p className="text-sm">
              {selectedStock.notes || "No additional notes available."}
            </p>
          </div>

          {selectedStock.breedingHistory && selectedStock.breedingHistory.length > 0 && (
            <div className="bg-muted/10 p-4 rounded-lg border border-muted">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-1.5 text-primary" />
                Breeding History
              </h3>
              <div className="space-y-2">
                {selectedStock.breedingHistory.map((event, index) => (
                  <div key={index} className="text-sm flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <span className="font-medium">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                      : {event.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedStock.traits && (
            <div className="bg-muted/10 p-4 rounded-lg border border-muted">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Dna className="h-4 w-4 mr-1.5 text-primary" />
                Traits
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selectedStock.traits).map(
                  ([trait, value]) => (
                    <div key={trait} className="text-sm">
                      <span className="text-muted-foreground capitalize">
                        {trait.replace(/([A-Z])/g, " $1").trim()}:
                      </span>{" "}
                      <span className="font-medium">{value}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Badge variant={selectedStock.reserved ? "warning" : "outline"} className="px-3 py-1">
              {selectedStock.reserved ? "Reserved" : "Available"}
            </Badge>
            <Badge variant={selectedStock.breeding ? "success" : "outline"} className="px-3 py-1">
              {selectedStock.breeding ? "In Breeding Program" : "Not in Breeding"}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => toggleReserveStatus(selectedStock.id)}
              className="flex items-center gap-1"
            >
              {selectedStock.reserved ? 
                <><CheckCircle2 className="h-4 w-4 mr-1" /> Unreserve</> : 
                <><Bookmark className="h-4 w-4 mr-1" /> Reserve</>}
            </Button>
            <Button 
              variant={selectedStock.breeding ? "destructive" : "default"}
              onClick={() => {
                const updatedStock = breedingStock.map(item => 
                  item.id === selectedStock.id ? {...item, breeding: !item.breeding} : item
                );
                setBreedingStock(updatedStock);
                setSelectedStock({...selectedStock, breeding: !selectedStock.breeding});
                toast.success(selectedStock.breeding ? "Removed from breeding program" : "Added to breeding program");
              }}
              className="flex items-center gap-1"
            >
              {selectedStock.breeding ? 
                <><X className="h-4 w-4 mr-1" /> Remove from Breeding</> : 
                <><Heart className="h-4 w-4 mr-1" /> Add to Breeding</>}
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Breeding Stock Finder</h2>
          <p className="text-muted-foreground">
            Search and manage breeding stock for your farm
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={category}
            onValueChange={(value) => setCategory(value || "chicken")}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chicken">Chickens</SelectItem>
              <SelectItem value="duck">Ducks</SelectItem>
              <SelectItem value="turkey">Turkeys</SelectItem>
              <SelectItem value="goose">Geese</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={resetFilters}>
            <FilterX className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline">
            <MapPin className="h-4 w-4 mr-2" />
            Near Me
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Find Stock</CardTitle>
                <Badge>{filteredStock.length} Results</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by name, breed, or ID..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value || "newest")}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">
                      <div className="flex items-center">
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        <span>Newest</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="oldest">
                      <div className="flex items-center">
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        <span>Oldest</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="age-asc">
                      <div className="flex items-center">
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        <span>Age (Youngest)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="age-desc">
                      <div className="flex items-center">
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        <span>Age (Oldest)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="name">
                      <div className="flex items-center">
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        <span>Name</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="breed">
                      <div className="flex items-center">
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        <span>Breed</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Select
                  value={breedFilter}
                  onValueChange={(value) =>
                    setBreedFilter(value === "all-breeds" ? "" : value || "")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Breed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-breeds">All Breeds</SelectItem>
                    {breeds.map((breed) => (
                      <SelectItem
                        key={typeof breed === "string" ? breed : breed.id}
                        value={typeof breed === "string" ? breed : breed.name}
                      >
                        {typeof breed === "string" ? breed : breed.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={sexFilter}
                  onValueChange={(value) =>
                    setSexFilter(value === "all-sex" ? "" : value || "")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-sex">All</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={ageFilter}
                  onValueChange={(value) =>
                    setAgeFilter(value === "all-ages" ? "" : value || "")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Age" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-ages">All Ages</SelectItem>
                    <SelectItem value="young">Young (0-12 months)</SelectItem>
                    <SelectItem value="mature">
                      Mature (12-36 months)
                    </SelectItem>
                    <SelectItem value="senior">Senior (36+ months)</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={conditionFilter}
                  onValueChange={(value) =>
                    setConditionFilter(
                      value === "all-conditions" ? "" : value || ""
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-conditions">All</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="available">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Available
              </TabsTrigger>
              <TabsTrigger value="reserved">
                <Bookmark className="h-4 w-4 mr-2" />
                Reserved
              </TabsTrigger>
              <TabsTrigger value="breeding">
                <Heart className="h-4 w-4 mr-2" />
                Breeding
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                    <p>Loading breeding stock...</p>
                  </div>
                </div>
              ) : filteredStock.length === 0 ? (
                <Card className="p-8">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No stock found</h3>
                    <p className="text-muted-foreground mb-4">
                      No breeding stock matches your current filters.
                    </p>
                    <Button onClick={resetFilters}>
                      <FilterX className="h-4 w-4 mr-2" />
                      Reset Filters
                    </Button>
                  </div>
                </Card>
              ) : (
                <div>{filteredStock.map(renderStockItem)}</div>
              )}
            </div>
          </Tabs>
        </div>

        <div>
          {selectedStock ? (
            renderStockDetails()
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 min-h-[400px]">
                <Bird className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2 text-center">
                  Select a Stock
                </h3>
                <p className="text-center text-muted-foreground mb-4">
                  Click on any stock item to view detailed information
                </p>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setSearchQuery("Brahma")}
                  >
                    <span>Search for Brahma</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setSexFilter("female")}
                  >
                    <span>Filter for Females</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setConditionFilter("excellent")}
                  >
                    <span>Show Excellent Condition</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Stock Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Dna className="h-4 w-4 mt-0.5 text-blue-500" />
                  <p>
                    For breeding programs, choose stock with excellent condition
                    ratings.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Star className="h-4 w-4 mt-0.5 text-amber-500" />
                  <p>
                    Mature birds (12-36 months) are typically in their breeding
                    prime.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <ThumbsUp className="h-4 w-4 mt-0.5 text-green-500" />
                  <p>Reserve breeding stock early to ensure availability.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Egg className="h-4 w-4 mt-0.5 text-purple-500" />
                  <p>
                    For egg production, breeds like Leghorn and Rhode Island Red
                    excel.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BreedingStockFinder;

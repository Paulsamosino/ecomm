import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "@/components/ui/sortable-item";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Check,
  ChevronRight,
  Clock,
  Edit,
  Heart,
  Info,
  Loader2,
  MoreVertical,
  Plus,
  Trash,
  Search,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import breedingService from "@/services/breedingService";

const BREEDING_STATUSES = [
  {
    value: "planning",
    label: "Planning",
    color: "bg-amber-200",
  },
  {
    value: "active",
    label: "Active",
    color: "bg-amber-500",
  },
  {
    value: "incubating",
    label: "Incubating",
    color: "bg-amber-600",
  },
  {
    value: "hatched",
    label: "Hatched",
    color: "bg-green-500",
  },
  {
    value: "completed",
    label: "Completed",
    color: "bg-amber-800",
  },
];

const BreedingPairManager = ({ onUpdate }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pairs, setPairs] = useState([]);
  const [breedingStock, setBreedingStock] = useState([]);
  const [showNewPairDialog, setShowNewPairDialog] = useState(false);
  const [selectedSire, setSelectedSire] = useState("");
  const [selectedDam, setSelectedDam] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pairsData, stockData] = await Promise.all([
        breedingService.getBreedingPairs(),
        breedingService.getBreedingStock(),
      ]);
      setPairs(pairsData);
      setBreedingStock(stockData);
    } catch (error) {
      console.error("Error loading breeding data:", error);
      toast({
        title: "Error",
        description: "Failed to load breeding pairs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePair = async () => {
    if (!selectedSire || !selectedDam || !startDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const newPair = await breedingService.createBreedingPair({
        sireId: selectedSire,
        damId: selectedDam,
        startDate,
        notes,
      });

      setPairs([...pairs, newPair]);
      setShowNewPairDialog(false);
      resetForm();

      if (onUpdate) {
        onUpdate();
      }

      toast({
        title: "Success",
        description: "New breeding pair created successfully.",
      });
    } catch (error) {
      console.error("Error creating breeding pair:", error);
      toast({
        title: "Error",
        description: "Failed to create breeding pair. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (pairId, newStatus) => {
    try {
      await breedingService.updateBreedingPairStatus(pairId, newStatus);
      setPairs(
        pairs.map((pair) =>
          pair.id === pairId ? { ...pair, status: newStatus } : pair
        )
      );

      if (onUpdate) {
        onUpdate();
      }

      toast({
        title: "Success",
        description: "Breeding pair status updated successfully.",
      });
    } catch (error) {
      console.error("Error updating breeding pair status:", error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setPairs((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const resetForm = () => {
    setSelectedSire("");
    setSelectedDam("");
    setStartDate(new Date());
    setNotes("");
  };

  const filteredPairs = pairs.filter((pair) => {
    if (statusFilter !== "all" && pair.status !== statusFilter) return false;
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      pair.sire.breed.toLowerCase().includes(searchLower) ||
      pair.dam.breed.toLowerCase().includes(searchLower) ||
      pair.sire.name.toLowerCase().includes(searchLower) ||
      pair.dam.name.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-amber-900">
            Breeding Pairs
          </h2>
          <p className="text-amber-700">
            Manage and track your active breeding pairs
          </p>
        </div>
        <Dialog open={showNewPairDialog} onOpenChange={setShowNewPairDialog}>
          <DialogTrigger asChild>
            <Button className="breeding-action-button">
              <Plus className="mr-2 h-4 w-4" />
              New Breeding Pair
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Breeding Pair</DialogTitle>
              <DialogDescription>
                Select breeding stock and set up a new breeding pair
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="sire">Sire</Label>
                <Select value={selectedSire} onValueChange={setSelectedSire}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select male breeder" />
                  </SelectTrigger>
                  <SelectContent>
                    {breedingStock
                      .filter((animal) => animal.sex === "Male")
                      .map((sire) => (
                        <SelectItem
                          key={sire._id || sire.id}
                          value={sire._id || sire.id}
                        >
                          {sire.name} ({sire.breed})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dam">Dam</Label>
                <Select value={selectedDam} onValueChange={setSelectedDam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select female breeder" />
                  </SelectTrigger>
                  <SelectContent>
                    {breedingStock
                      .filter((animal) => animal.sex === "Female")
                      .map((dam) => (
                        <SelectItem
                          key={dam._id || dam.id}
                          value={dam._id || dam.id}
                        >
                          {dam.name} ({dam.breed})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? (
                        format(startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
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
                  placeholder="Add any breeding notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowNewPairDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreatePair} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Pair"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-amber-600" />
        <Input
          placeholder="Search breeding pairs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm border-amber-200 focus:ring-amber-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {BREEDING_STATUSES.map((status) => (
            <Card key={status.value} className="breeding-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-amber-900">
                    {status.label}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 border-amber-200"
                  >
                    {pairs.filter((p) => p.status === status.value).length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {pairs
                      .filter((p) => p.status === status.value)
                      .map((pair) => (
                        <motion.div
                          key={pair.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="p-4 bg-white rounded-lg border border-amber-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-amber-900">
                                {pair.sire.breed} × {pair.dam.breed}
                              </h4>
                              <p className="text-sm text-amber-700">
                                Started:{" "}
                                {format(new Date(pair.startDate), "PP")}
                              </p>
                            </div>
                            <Select
                              value={pair.status}
                              onValueChange={(value) =>
                                handleStatusChange(pair.id, value)
                              }
                            >
                              <SelectTrigger className="w-[120px] border-amber-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {BREEDING_STATUSES.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={cn(
                                          "w-2 h-2 rounded-full",
                                          s.color
                                        )}
                                      />
                                      {s.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-amber-800">
                              <Heart className="h-4 w-4 text-amber-600" />
                              <span>
                                {pair.sire.name} & {pair.dam.name}
                              </span>
                            </div>
                            {pair.expectedHatchDate && (
                              <div className="flex items-center gap-2 text-sm text-amber-800">
                                <Clock className="h-4 w-4 text-amber-600" />
                                <span>
                                  Expected hatch:{" "}
                                  {format(
                                    new Date(pair.expectedHatchDate),
                                    "PP"
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                          {pair.notes && (
                            <p className="mt-2 text-sm text-amber-700">
                              {pair.notes}
                            </p>
                          )}

                          <div className="mt-3 h-1 bg-amber-100 rounded-full overflow-hidden">
                            <div
                              className="h-full breeding-progress-bar transition-all duration-300"
                              style={{ width: `${pair.progress}%` }}
                            />
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BreedingPairManager;

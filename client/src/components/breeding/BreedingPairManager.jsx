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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { breedingService } from "@/services/breedingService";
import { toast } from "react-hot-toast";
import {
  PlusCircle,
  CalendarIcon,
  MoreHorizontal,
  Check,
  X,
  AlertTriangle,
  Heart,
  Filter,
  Search,
} from "lucide-react";

const BreedingPairManager = ({ projectId = null }) => {
  const [pairs, setPairs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [pureBreeds, setPureBreeds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedPair, setSelectedPair] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState(projectId || "all");

  const [formData, setFormData] = useState({
    breed1: "",
    breed2: "",
    sireId: "",
    damId: "",
    projectId: projectId || "",
    startDate: new Date(),
    notes: "",
    status: "pending",
  });

  const [eventData, setEventData] = useState({
    type: "check",
    date: new Date(),
    notes: "",
    result: "",
  });

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load breeding pairs
      const pairsData = projectId
        ? await breedingService.getBreedingPairsByProject(projectId)
        : await breedingService.getBreedingPairs();
      setPairs(pairsData);

      // Load projects for dropdown
      const projectsData = await breedingService.getBreedingProjects();
      setProjects(projectsData);

      // Load breeds
      const breedsData = await breedingService.getBreeds();
      setPureBreeds(breedsData);
    } catch (error) {
      console.error("Failed to load breeding data:", error);
      toast.error("Failed to load breeding data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEventInputChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEventSelectChange = (name, value) => {
    setEventData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      breed1: "",
      breed2: "",
      sireId: "",
      damId: "",
      projectId: projectId || "",
      startDate: new Date(),
      notes: "",
      status: "pending",
    });
  };

  const resetEventForm = () => {
    setEventData({
      type: "check",
      date: new Date(),
      notes: "",
      result: "",
    });
  };

  const handleCreatePair = async () => {
    try {
      const newPair = await breedingService.createBreedingPair(formData);
      if (newPair) {
        setPairs([...pairs, newPair]);
        toast.success("Breeding pair created successfully");
        setIsCreateDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to create breeding pair:", error);
      toast.error("Failed to create breeding pair");
    }
  };

  const handleAddEvent = async () => {
    if (!selectedPair) return;

    try {
      const updatedPair = await breedingService.addBreedingEvent(
        selectedPair.id,
        eventData
      );

      if (updatedPair) {
        // Update the pairs list with the updated pair
        setPairs(
          pairs.map((pair) => (pair.id === updatedPair.id ? updatedPair : pair))
        );

        // If this is a status change event, update the pair status
        if (eventData.type === "status" && eventData.result) {
          await handleStatusChange(selectedPair.id, eventData.result);
        }

        toast.success("Event added successfully");
        setIsEventDialogOpen(false);
        resetEventForm();
        setSelectedPair(null);
      }
    } catch (error) {
      console.error("Failed to add event:", error);
      toast.error("Failed to add event");
    }
  };

  const handleStatusChange = async (pairId, newStatus) => {
    try {
      const updated = await breedingService.updateBreedingPairStatus(
        pairId,
        newStatus
      );

      if (updated) {
        setPairs(
          pairs.map((pair) =>
            pair.id === pairId ? { ...pair, status: newStatus } : pair
          )
        );
        toast.success(`Status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleRemovePair = async (pairId) => {
    if (!confirm("Are you sure you want to remove this breeding pair?")) {
      return;
    }

    try {
      const result = await breedingService.deleteBreedingPair(pairId);
      if (result.success) {
        setPairs(pairs.filter((pair) => pair.id !== pairId));
        toast.success("Breeding pair removed successfully");
      }
    } catch (error) {
      console.error("Failed to remove breeding pair:", error);
      toast.error("Failed to remove breeding pair");
    }
  };

  const openEventDialog = (pair) => {
    setSelectedPair(pair);
    setIsEventDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "secondary",
      active: "success",
      breeding: "success",
      pregnant: "warning",
      hatched: "default",
      failed: "destructive",
      completed: "default",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredPairs = pairs.filter((pair) => {
    // Status filter
    const statusMatch = statusFilter === "all" || pair.status === statusFilter;

    // Project filter
    const projectMatch =
      projectFilter === "all" || pair.projectId === projectFilter;

    // Search query
    const searchLower = searchQuery.toLowerCase();
    const searchMatch =
      !searchQuery ||
      pair.breed1.toLowerCase().includes(searchLower) ||
      pair.breed2.toLowerCase().includes(searchLower) ||
      pair.sireId.toLowerCase().includes(searchLower) ||
      pair.damId.toLowerCase().includes(searchLower) ||
      (pair.notes && pair.notes.toLowerCase().includes(searchLower));

    return statusMatch && projectMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Breeding Pairs</h2>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pairs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="breeding">Breeding</SelectItem>
              <SelectItem value="pregnant">Pregnant</SelectItem>
              <SelectItem value="hatched">Hatched</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          {!projectId && (
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 whitespace-nowrap">
                <PlusCircle className="h-4 w-4" />
                New Pair
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create New Breeding Pair</DialogTitle>
                <DialogDescription>
                  Set up a new breeding pair to track breeding activities
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="breed1">Sire Breed</Label>
                    <Select
                      value={formData.breed1}
                      onValueChange={(value) =>
                        handleSelectChange("breed1", value)
                      }
                    >
                      <SelectTrigger id="breed1">
                        <SelectValue placeholder="Select breed" />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-[200px]">
                          {pureBreeds.map((breed) => (
                            <SelectItem key={`sire-${breed}`} value={breed}>
                              {breed}
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="breed2">Dam Breed</Label>
                    <Select
                      value={formData.breed2}
                      onValueChange={(value) =>
                        handleSelectChange("breed2", value)
                      }
                    >
                      <SelectTrigger id="breed2">
                        <SelectValue placeholder="Select breed" />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-[200px]">
                          {pureBreeds.map((breed) => (
                            <SelectItem key={`dam-${breed}`} value={breed}>
                              {breed}
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sireId">Sire ID</Label>
                    <Input
                      id="sireId"
                      name="sireId"
                      value={formData.sireId}
                      onChange={handleInputChange}
                      placeholder="Unique ID for male"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="damId">Dam ID</Label>
                    <Input
                      id="damId"
                      name="damId"
                      value={formData.damId}
                      onChange={handleInputChange}
                      placeholder="Unique ID for female"
                    />
                  </div>
                </div>

                {!projectId && (
                  <div className="grid gap-2">
                    <Label htmlFor="projectId">Project</Label>
                    <Select
                      value={formData.projectId}
                      onValueChange={(value) =>
                        handleSelectChange("projectId", value)
                      }
                    >
                      <SelectTrigger id="projectId">
                        <SelectValue placeholder="Select project (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-project">No Project</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? (
                          format(formData.startDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) =>
                          setFormData((prev) => ({ ...prev, startDate: date }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Additional information about this pair"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreatePair}>Create Pair</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <p>Loading breeding pairs...</p>
        </div>
      ) : filteredPairs.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Heart className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Breeding Pairs</h3>
            <p className="text-center text-muted-foreground mb-4">
              Create your first breeding pair to start tracking breeding
              activities
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Create First Pair
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pair</TableHead>
                  <TableHead>IDs</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPairs.map((pair) => (
                  <TableRow key={pair.id}>
                    <TableCell>
                      <div className="font-medium">
                        {pair.breed1} × {pair.breed2}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {pair.events?.length || 0} events
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-medium">Sire:</span> {pair.sireId}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Dam:</span> {pair.damId}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(pair.startDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(pair.status)}</TableCell>
                    <TableCell>
                      {pair.projectId ? (
                        projects.find((p) => p.id === pair.projectId)?.name ||
                        "Unknown"
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEventDialog(pair)}
                          >
                            Add Event
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(pair.id, "active")
                            }
                          >
                            Mark as Active
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(pair.id, "breeding")
                            }
                          >
                            Mark as Breeding
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(pair.id, "pregnant")
                            }
                          >
                            Mark as Pregnant
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(pair.id, "hatched")
                            }
                          >
                            Mark as Hatched
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(pair.id, "completed")
                            }
                          >
                            Mark as Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(pair.id, "failed")
                            }
                          >
                            Mark as Failed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRemovePair(pair.id)}
                            className="text-red-600"
                          >
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Breeding Event</DialogTitle>
            <DialogDescription>
              Record a new event for this breeding pair
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="event-type">Event Type</Label>
              <Select
                value={eventData.type}
                onValueChange={(value) =>
                  handleEventSelectChange("type", value)
                }
              >
                <SelectTrigger id="event-type">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="check">Health Check</SelectItem>
                  <SelectItem value="breeding">Breeding</SelectItem>
                  <SelectItem value="egg">Egg Laid</SelectItem>
                  <SelectItem value="hatch">Hatching</SelectItem>
                  <SelectItem value="status">Status Change</SelectItem>
                  <SelectItem value="note">General Note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {eventData.type === "status" && (
              <div className="grid gap-2">
                <Label htmlFor="event-result">New Status</Label>
                <Select
                  value={eventData.result}
                  onValueChange={(value) =>
                    handleEventSelectChange("result", value)
                  }
                >
                  <SelectTrigger id="event-result">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="breeding">Breeding</SelectItem>
                    <SelectItem value="pregnant">Pregnant</SelectItem>
                    <SelectItem value="hatched">Hatched</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="event-date">Event Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !eventData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {eventData.date ? (
                      format(eventData.date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={eventData.date}
                    onSelect={(date) =>
                      setEventData((prev) => ({ ...prev, date: date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="event-notes">Notes</Label>
              <Textarea
                id="event-notes"
                name="notes"
                value={eventData.notes}
                onChange={handleEventInputChange}
                placeholder="Details about this event"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEventDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddEvent}>Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BreedingPairManager;

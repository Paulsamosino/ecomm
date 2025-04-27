import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import breedingService from "@/services/breedingService";

const BreedingPairManager = () => {
  const { toast } = useToast();
  const [breedingPairs, setBreedingPairs] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSire, setSelectedSire] = useState("");
  const [selectedDam, setSelectedDam] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedGeneration, setSelectedGeneration] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pairs, inventoryData, projectsData] = await Promise.all([
        breedingService.getBreedingPairs(),
        fetch("/api/inventory/breeding-stock").then((res) => res.json()),
        breedingService.getBreedingProjects(),
      ]);
      setBreedingPairs(pairs);
      setInventory(inventoryData);
      setProjects(projectsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load breeding data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePair = async () => {
    if (!selectedSire || !selectedDam) {
      toast({
        title: "Validation Error",
        description: "Please select both sire and dam",
        variant: "destructive",
      });
      return;
    }

    try {
      const newPairData = {
        sire: selectedSire,
        dam: selectedDam,
      };
      if (selectedProject && selectedGeneration) {
        newPairData.projectId = selectedProject;
        newPairData.generationNumber = parseInt(selectedGeneration);
      }

      const newPair = await breedingService.createBreedingPair(newPairData);
      setBreedingPairs([...breedingPairs, newPair]);
      toast({
        title: "Success",
        description: "Breeding pair created successfully",
      });
      resetForm();
    } catch (error) {
      console.error("Error creating breeding pair:", error);
      toast({
        title: "Error",
        description: "Failed to create breeding pair",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (pairId, newStatus) => {
    try {
      await breedingService.updateBreedingPairStatus(pairId, newStatus);
      loadData();
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
    } catch (error) {
      console.error("Error updating breeding pair status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedSire("");
    setSelectedDam("");
    setSelectedProject("");
    setSelectedGeneration("");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Planning":
        return "bg-[#fff5e8] text-[#a05e2b]";
      case "Active":
        return "bg-green-100 text-green-800";
      case "Completed":
        return "bg-[#ffeed7] text-[#a05e2b]";
      case "Failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAvailableGenerations = () => {
    const project = projects.find((p) => p._id === selectedProject);
    if (!project) return [];
    return project.generations || [];
  };

  return (
    <div className="space-y-6">
      <Card className="border-[#ffb464]/30">
        <CardHeader className="bg-gradient-to-r from-[#fff5e8] to-[#ffeed7]">
          <CardTitle className="text-[#a05e2b]">Create Breeding Pair</CardTitle>
          <CardDescription className="text-[#b06a30]">
            Select breeding stock and optionally assign to a project generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[#a05e2b]">
                Sire
              </label>
              <Select value={selectedSire} onValueChange={setSelectedSire}>
                <SelectTrigger className="border-[#ffb464]/30">
                  <SelectValue placeholder="Select sire" />
                </SelectTrigger>
                <SelectContent>
                  {inventory
                    .filter((animal) => animal.sex === "Male")
                    .map((animal) => (
                      <SelectItem key={animal._id} value={animal._id}>
                        {animal.name} ({animal.breed})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[#a05e2b]">
                Dam
              </label>
              <Select value={selectedDam} onValueChange={setSelectedDam}>
                <SelectTrigger className="border-[#ffb464]/30">
                  <SelectValue placeholder="Select dam" />
                </SelectTrigger>
                <SelectContent>
                  {inventory
                    .filter((animal) => animal.sex === "Female")
                    .map((animal) => (
                      <SelectItem key={animal._id} value={animal._id}>
                        {animal.name} ({animal.breed})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[#a05e2b]">
                Assign to Project (Optional)
              </label>
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
              >
                <SelectTrigger className="border-[#ffb464]/30">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project._id} value={project._id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[#a05e2b]">
                Project Generation (Optional)
              </label>
              <Select
                value={selectedGeneration}
                onValueChange={setSelectedGeneration}
                disabled={!selectedProject}
              >
                <SelectTrigger className="border-[#ffb464]/30">
                  <SelectValue placeholder="Select generation" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableGenerations().map((gen) => (
                    <SelectItem key={gen.number} value={gen.number.toString()}>
                      Generation {gen.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            className="mt-4 w-full bg-gradient-to-r from-[#ffb464] to-[#ffa040] text-white hover:from-[#ffa040] hover:to-[#ff9020]"
            onClick={handleCreatePair}
            disabled={!selectedSire || !selectedDam || loading}
          >
            Create Breeding Pair
          </Button>
        </CardContent>
      </Card>

      <Card className="border-[#ffb464]/30">
        <CardHeader className="bg-gradient-to-r from-[#fff5e8] to-[#ffeed7]">
          <CardTitle className="text-[#a05e2b]">
            Active Breeding Pairs
          </CardTitle>
          <CardDescription className="text-[#b06a30]">
            Manage and track your breeding pairs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pair ID</TableHead>
                <TableHead>Sire</TableHead>
                <TableHead>Dam</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Expected Hatch</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breedingPairs.map((pair) => (
                <TableRow key={pair._id}>
                  <TableCell>{pair._id.slice(-6)}</TableCell>
                  <TableCell>
                    {pair.sire?.name || "N/A"}
                    <br />
                    <span className="text-sm text-[#b06a30]">
                      {pair.sire?.breed || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {pair.dam?.name || "N/A"}
                    <br />
                    <span className="text-sm text-[#b06a30]">
                      {pair.dam?.breed || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(pair.status)}>
                      {pair.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {pair.startDate
                      ? new Date(pair.startDate).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {pair.expectedHatchDate ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#ffb464]" />
                        {new Date(pair.expectedHatchDate).toLocaleDateString()}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {pair.project ? (
                      <Button
                        variant="link"
                        asChild
                        className="text-[#ffb464] hover:text-[#ffa040]"
                      >
                        <Link to={`/seller/breeding-projects/${pair.project}`}>
                          View Project
                        </Link>
                      </Button>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={pair.status}
                      onValueChange={(value) =>
                        handleStatusUpdate(pair._id, value)
                      }
                    >
                      <SelectTrigger className="w-[120px] border-[#ffb464]/30">
                        <SelectValue placeholder="Update status" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Planning",
                          "Active",
                          "Completed",
                          "Failed",
                          "Cancelled",
                        ].map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {loading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-[#b06a30]">
                    Loading pairs...
                  </TableCell>
                </TableRow>
              )}
              {!loading && breedingPairs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-[#b06a30]">
                    No breeding pairs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BreedingPairManager;

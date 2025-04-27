import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Info,
  Search,
  ChevronRight,
  ChevronDown,
  Plus,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import breedingService from "@/services/breedingService";
import toast from "react-hot-toast";

const BreedingLineage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [generations, setGenerations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGenerations, setExpandedGenerations] = useState({});
  const [activeTab, setActiveTab] = useState("lineage");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await breedingService.getBreedingProjects();
      setProjects(response);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Could not load your breeding projects.");
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetails = async (projectId) => {
    try {
      setLoading(true);
      const project = await breedingService.getBreedingProject(projectId);
      setSelectedProject(project);
      setGenerations(project.generations || []);
      
      // Initialize expanded state for all generations
      const expandedState = {};
      (project.generations || []).forEach((gen) => {
        expandedState[gen.number] = false;
      });
      setExpandedGenerations(expandedState);
    } catch (error) {
      console.error("Error loading project details:", error);
      toast.error("Could not load project details.");
    } finally {
      setLoading(false);
    }
  };

  const toggleGeneration = (generationNumber) => {
    setExpandedGenerations({
      ...expandedGenerations,
      [generationNumber]: !expandedGenerations[generationNumber],
    });
  };

  const handlePlanNextGeneration = async () => {
    if (!selectedProject) return;
    
    try {
      const nextGenNumber = generations.length > 0 
        ? Math.max(...generations.map(g => g.number)) + 1 
        : 1;
      
      await breedingService.addGeneration(selectedProject._id, {
        number: nextGenNumber,
        status: "Planned",
        notes: "Planning new generation",
        pairs: [],
        expectedTraits: []
      });
      
      // Refresh project details
      loadProjectDetails(selectedProject._id);
      
      toast.success(`Generation ${nextGenNumber} has been added to your project.`);
    } catch (error) {
      console.error("Error adding generation:", error);
      toast.error("Could not add new generation to project.");
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800";
      case "Planned":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Visualization renderer for lineage tree
  const renderLineageTree = () => {
    if (!selectedProject || generations.length === 0) {
      return (
        <div className="text-center p-6 text-gray-500">
          No generations found for this project. Plan your first generation to start.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {generations
          .sort((a, b) => a.number - b.number)
          .map((generation) => (
            <div key={generation.number} className="border rounded-lg">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleGeneration(generation.number)}
              >
                <div className="flex items-center space-x-2">
                  {expandedGenerations[generation.number] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <h3 className="font-medium">Generation {generation.number}</h3>
                  <Badge className={getStatusBadgeClass(generation.status)}>
                    {generation.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  {generation.pairs.length} breeding pairs
                </div>
              </div>

              {expandedGenerations[generation.number] && (
                <div className="p-4 border-t">
                  {generation.pairs.length === 0 ? (
                    <div className="text-sm text-gray-500 p-2 text-center">
                      No breeding pairs in this generation yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {generation.pairs.map((pairId, index) => (
                        <BreedingPairCard key={pairId} pairId={pairId} index={index} />
                      ))}
                    </div>
                  )}

                  {generation.expectedTraits.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2">Expected Traits</h4>
                      <div className="flex flex-wrap gap-2">
                        {generation.expectedTraits.map((trait, index) => (
                          <div key={index} className="flex items-center space-x-1">
                            <Badge variant="outline">
                              {trait.trait} ({trait.probability}%)
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {generation.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-sm text-gray-600">{generation.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>
    );
  };

  // Card component for breeding pair visualization
  const BreedingPairCard = ({ pairId, index }) => {
    const [pair, setPair] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadPair = async () => {
        try {
          setLoading(true);
          const response = await breedingService.getBreedingPair(pairId);
          setPair(response);
        } catch (error) {
          console.error(`Error loading pair ${pairId}:`, error);
        } finally {
          setLoading(false);
        }
      };

      loadPair();
    }, [pairId]);

    if (loading) {
      return <div className="h-24 bg-gray-100 animate-pulse rounded-md"></div>;
    }

    if (!pair) {
      return <div className="text-sm text-gray-500">Pair not found</div>;
    }

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">
                Pair {index + 1}: {pair.sireName} × {pair.damName}
              </h4>
              <p className="text-sm text-gray-500">
                {pair.sireBreed} × {pair.damBreed}
              </p>
            </div>
            <Badge className={getStatusBadgeClass(pair.status)}>
              {pair.status}
            </Badge>
          </div>

          {pair.offspring && pair.offspring.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm font-medium">
                Offspring: {pair.offspring.length}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Planning tools for multi-generation breeding
  const renderPlanningTools = () => {
    return (
      <div className="space-y-6">
        <div className="p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium mb-2">Multi-Generation Breeding Strategy</h3>
          <p className="text-sm text-gray-600 mb-4">
            Plan your breeding strategy across multiple generations to achieve your genetic goals.
          </p>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="goal" className="mb-1 block">Primary Breeding Goal</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="color">Color Enhancement</SelectItem>
                  <SelectItem value="size">Size Improvement</SelectItem>
                  <SelectItem value="egg">Egg Production</SelectItem>
                  <SelectItem value="meat">Meat Quality</SelectItem>
                  <SelectItem value="health">Health & Vigor</SelectItem>
                  <SelectItem value="custom">Custom Goal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="generations" className="mb-1 block">Number of Generations</Label>
              <Input type="number" min="1" max="10" defaultValue="3" />
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" className="mr-2">Save Plan</Button>
              <Button>Generate Strategy</Button>
            </div>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Trait Selection Priority</h3>
          <p className="text-sm text-gray-600 mb-4">
            Set priority levels for traits you want to focus on in your breeding program.
          </p>
          
          <div className="space-y-3">
            {[
              { name: "Egg Production", default: "Medium" },
              { name: "Egg Color", default: "Low" },
              { name: "Size/Weight", default: "High" },
              { name: "Feather Color", default: "Medium" },
              { name: "Temperament", default: "High" },
            ].map((trait) => (
              <div key={trait.name} className="flex items-center justify-between">
                <span className="text-sm">{trait.name}</span>
                <Select defaultValue={trait.default}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Breeding Lineage Tracker</h2>

        <div className="flex space-x-2">
          <Select
            value={selectedProject?._id || ""}
            onValueChange={(value) => loadProjectDetails(value)}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a breeding project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project._id} value={project._id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedProject && (
            <Button onClick={handlePlanNextGeneration}>
              <Plus className="h-4 w-4 mr-2" />
              Add Generation
            </Button>
          )}
        </div>
      </div>

      {selectedProject && (
        <div className="flex items-center space-x-2 mb-4">
          <Badge className={getStatusBadgeClass(selectedProject.status)}>
            {selectedProject.status}
          </Badge>
          <p className="text-sm text-gray-500">
            Started: {new Date(selectedProject.startDate).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-500">
            Goal: {selectedProject.goal}
          </p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lineage">Lineage Tree</TabsTrigger>
          <TabsTrigger value="planning">Planning Tools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lineage" className="mt-4">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : !selectedProject ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No project selected</AlertTitle>
              <AlertDescription>
                Select a breeding project to view its lineage.
              </AlertDescription>
            </Alert>
          ) : (
            renderLineageTree()
          )}
        </TabsContent>
        
        <TabsContent value="planning" className="mt-4">
          {!selectedProject ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No project selected</AlertTitle>
              <AlertDescription>
                Select a breeding project to access planning tools.
              </AlertDescription>
            </Alert>
          ) : (
            renderPlanningTools()
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BreedingLineage;

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Plus, ChevronRight } from "lucide-react";
import breedingService from "@/services/breedingService";
import toast from "react-hot-toast";

const BreedingProjectManager = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    goal: "Improved Egg Production",
    estimatedDuration: 12, // months
  });

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
      toast.error("Failed to load breeding projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      if (!newProject.name) {
        toast.error("Project name is required");
        return;
      }

      const response = await breedingService.createBreedingProject({
        ...newProject,
        startDate: new Date(),
        status: "Planning",
      });

      toast.success("Breeding project created successfully");
      loadProjects();
      resetForm();
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create breeding project");
    }
  };

  const resetForm = () => {
    setNewProject({
      name: "",
      description: "",
      goal: "Improved Egg Production",
      estimatedDuration: 12,
    });
  };

  const calculateProgress = (project) => {
    // If no generations or pairs, return 0
    if (!project.generations || project.generations.length === 0) return 0;
    
    // Count completed vs total pairs
    let completedPairs = 0;
    let totalPairs = 0;
    
    project.generations.forEach(gen => {
      if (gen.pairs && gen.pairs.length > 0) {
        totalPairs += gen.pairs.length;
        // We would need to check each pair's status from the backend
        // This is a simplification
        completedPairs += gen.pairs.filter(pair => pair.status === "Completed").length;
      }
    });
    
    if (totalPairs === 0) return 0;
    return Math.round((completedPairs / totalPairs) * 100);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Planning":
        return "bg-blue-100 text-blue-800";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "On Hold":
        return "bg-gray-100 text-gray-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Breeding Projects</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Breeding Project</DialogTitle>
              <DialogDescription>
                Set up a new breeding project to track your goals and progress.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  placeholder="e.g., Blue Egg Layer Development"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="goal">Breeding Goal</Label>
                <Input
                  id="goal"
                  value={newProject.goal}
                  onChange={(e) =>
                    setNewProject({ ...newProject, goal: e.target.value })
                  }
                  placeholder="e.g., Improved Egg Production"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">
                  Estimated Duration (months)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="60"
                  value={newProject.estimatedDuration}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      estimatedDuration: parseInt(e.target.value) || 12,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe your breeding goals and strategy..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject}>Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-6 bg-gray-200 rounded-md mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded-md w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded-md mb-4 w-full"></div>
                <div className="h-4 bg-gray-200 rounded-md mb-4 w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded-md w-4/6"></div>
              </CardContent>
              <CardFooter>
                <div className="h-8 bg-gray-200 rounded-md w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-medium">No breeding projects yet</h3>
              <p className="text-gray-500">
                Create your first breeding project to start tracking your
                genetic improvements.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Breeding Project</DialogTitle>
                    <DialogDescription>
                      Set up a new breeding project to track your goals and
                      progress.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Project Name</Label>
                      <Input
                        id="name"
                        value={newProject.name}
                        onChange={(e) =>
                          setNewProject({ ...newProject, name: e.target.value })
                        }
                        placeholder="e.g., Blue Egg Layer Development"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="goal">Breeding Goal</Label>
                      <Input
                        id="goal"
                        value={newProject.goal}
                        onChange={(e) =>
                          setNewProject({ ...newProject, goal: e.target.value })
                        }
                        placeholder="e.g., Improved Egg Production"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="duration">
                        Estimated Duration (months)
                      </Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        max="60"
                        value={newProject.estimatedDuration}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            estimatedDuration: parseInt(e.target.value) || 12,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newProject.description}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe your breeding goals and strategy..."
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateProject}>
                      Create Project
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project._id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>
                      Started {new Date(project.startDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusBadgeColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-gray-500 mb-4">
                  {project.description
                    ? project.description
                    : "No description provided."}
                </p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Goal: {project.goal}</span>
                      <span>{calculateProgress(project)}% Complete</span>
                    </div>
                    <Progress
                      value={calculateProgress(project)}
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Duration:</span>{" "}
                      {project.estimatedDuration} months
                    </div>
                    <div>
                      <span className="text-gray-500">Pairs:</span>{" "}
                      {project.generations
                        ? project.generations.reduce(
                            (sum, gen) => sum + (gen.pairs?.length || 0),
                            0
                          )
                        : 0}
                    </div>
                    <div>
                      <span className="text-gray-500">Generations:</span>{" "}
                      {project.generations ? project.generations.length : 0}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Navigate to project details
                  }}
                >
                  View Details
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BreedingProjectManager;

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
import {
  AlertCircle,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  Search,
  TreeDeciduous,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import breedingService from "@/services/breedingService";

const BreedingLineage = ({ onUpdate }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    goal: "",
    targetGenerations: 1,
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsData = await breedingService.getBreedingProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast({
        title: "Error",
        description: "Failed to load breeding projects. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      setLoading(true);
      const project = await breedingService.createBreedingProject(newProject);
      setProjects([...projects, project]);
      setShowNewProjectDialog(false);
      resetNewProjectForm();

      if (onUpdate) {
        onUpdate();
      }

      toast({
        title: "Success",
        description: "New breeding project created successfully.",
      });
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetNewProjectForm = () => {
    setNewProject({
      name: "",
      description: "",
      goal: "",
      targetGenerations: 1,
    });
  };

  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower)
    );
  });

  const renderProjectCard = (project) => (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>{project.name}</CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </div>
            <Badge
              variant={project.status === "active" ? "default" : "secondary"}
            >
              {project.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Goal:</span>
              <span>{project.goal}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Target Generations:</span>
              <span>{project.targetGenerations}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current Generation:</span>
              <span>{project.currentGeneration}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress:</span>
                <span>{project.progress}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex items-center text-sm text-muted-foreground">
            <FileText className="mr-2 h-4 w-4" />
            Created{" "}
            {project.startDate
              ? format(new Date(project.startDate), "PP")
              : "N/A"}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedProject(project)}
          >
            View Lineage
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );

  const renderLineageView = () => {
    if (!selectedProject) return null;

    return (
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Project Lineage: {selectedProject.name}</CardTitle>
              <CardDescription>
                Visualize breeding generations and relationships
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedProject(null)}
            >
              Back to Projects
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] flex items-center justify-center border-2 border-dashed rounded-lg">
            <div className="text-center space-y-2">
              <TreeDeciduous className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                Lineage visualization coming soon
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            Breeding Projects & Lineage
          </h2>
          <p className="text-muted-foreground">
            Manage breeding projects and track genetic lineage
          </p>
        </div>
        <Dialog
          open={showNewProjectDialog}
          onOpenChange={setShowNewProjectDialog}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent
            className="bg-white border-amber-200 shadow-md"
            style={{ opacity: 1 }}
          >
            <DialogHeader>
              <DialogTitle className="text-amber-900">
                Create New Breeding Project
              </DialogTitle>
              <DialogDescription className="text-amber-700">
                Set up a new breeding project to track lineage and goals
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  placeholder="Enter project name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe your breeding project"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Project Goal</Label>
                <Input
                  id="goal"
                  value={newProject.goal}
                  onChange={(e) =>
                    setNewProject({ ...newProject, goal: e.target.value })
                  }
                  placeholder="What are you trying to achieve?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="generations">Target Generations</Label>
                <Select
                  value={newProject.targetGenerations.toString()}
                  onValueChange={(value) =>
                    setNewProject({
                      ...newProject,
                      targetGenerations: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select number of generations" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} Generation{num > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowNewProjectDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : selectedProject ? (
        renderLineageView()
      ) : filteredProjects.length > 0 ? (
        filteredProjects.map((project) => renderProjectCard(project))
      ) : (
        <motion.div
          key="no-projects"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="col-span-full flex items-center justify-center h-40 border-2 border-dashed rounded-lg"
        >
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No breeding projects found</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BreedingLineage;

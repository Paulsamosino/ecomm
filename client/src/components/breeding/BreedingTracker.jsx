import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { breedingService } from "@/services/breedingService";
import { toast } from "react-hot-toast";
import {
  Calendar,
  Clock,
  Search,
  Filter,
  ChevronRight,
  AlertCircle,
  Info,
} from "lucide-react";

const BreedingTracker = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await breedingService.getBreedingProjects();
      setProjects(data);
    } catch (error) {
      console.error("Failed to load breeding projects:", error);
      toast.error("Failed to load breeding projects");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      planning: "secondary",
      active: "success",
      paused: "warning",
      completed: "default",
    };
    
    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const calculateProgress = (project) => {
    // Simple progress calculation based on pairs and status
    if (project.status === "completed") return 100;
    if (project.status === "planning") return 0;
    
    // Calculate based on pairs and events
    const pairsCount = project.pairs?.length || 0;
    const hasOffspring = project.pairs?.some(pair => pair.offspringCount > 0) || false;
    
    if (pairsCount === 0) return 10; // Just started
    if (hasOffspring) return 75; // Has offspring
    return 40; // Has pairs but no offspring yet
  };

  const filteredProjects = projects.filter((project) => {
    // Status filter
    const statusMatch = statusFilter === "all" || project.status === statusFilter;
    
    // Search query
    const searchLower = searchQuery.toLowerCase();
    const searchMatch =
      !searchQuery ||
      project.name.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower) ||
      project.goal.toLowerCase().includes(searchLower) ||
      project.targetBreed.toLowerCase().includes(searchLower);
    
    return statusMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Active Breeding Projects</h2>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
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
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <p>Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Projects Found</h3>
            <p className="text-center text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all"
                ? "No projects match your search criteria. Try adjusting your filters."
                : "No breeding projects have been created yet."}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button
                onClick={() => window.location.href = "/breeding-management/projects"}
                className="flex items-center gap-2"
              >
                Create First Project
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Project Overview</CardTitle>
            <CardDescription>
              Track the status and progress of your breeding projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Project</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Pairs</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      <div>{project.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {project.targetBreed}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={project.goal}>
                        {project.goal}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={calculateProgress(project)}
                          className="h-2 w-[60px]"
                        />
                        <span className="text-sm">
                          {calculateProgress(project)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.pairs?.length || 0} active
                    </TableCell>
                    <TableCell>
                      {new Date(project.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/breeding-management/projects/${project.id}`}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events Card */}
      {filteredProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>
              Important dates and milestones for your breeding projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projects.some(p => p.upcomingEvents?.length > 0) ? (
              <div className="space-y-4">
                {projects
                  .filter(p => p.upcomingEvents?.length > 0)
                  .map(project => (
                    <div key={`events-${project.id}`} className="border-b pb-4 last:border-0 last:pb-0">
                      <h3 className="font-medium mb-2">{project.name}</h3>
                      <div className="space-y-2">
                        {project.upcomingEvents?.map((event, index) => (
                          <div key={index} className="flex items-start gap-3 bg-muted/50 p-2 rounded-md">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <Calendar className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium">{event.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                {event.description}
                              </p>
                            </div>
                            <div className="text-xs flex items-center whitespace-nowrap">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {new Date(event.date).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <Info className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Upcoming Events</h3>
                <p className="text-center text-muted-foreground">
                  Add breeding pairs and events to see upcoming activities
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BreedingTracker;

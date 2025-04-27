import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import breedingService from "@/services/breedingService";
import { format } from "date-fns";

const BreedingTracker = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await breedingService.getProjects();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError("Failed to load breeding projects");
      console.error("Error loading breeding projects:", err);
    } finally {
      setLoading(false);
    }
  };

  // Format date safely with fallback
  const formatDate = (dateString) => {
    try {
      if (!dateString) return "Not specified";
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return "Invalid date";
      return format(date, "MMM d, yyyy");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid date";
    }
  };

  if (loading) {
    return <div>Loading breeding projects...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Breeding Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project._id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <p className="text-sm text-gray-500">
                        Started:{" "}
                        {formatDate(project.createdAt || project.startDate)}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {project.pairs &&
                          project.pairs.map((pair, index) => (
                            <Badge key={pair?._id || index} variant="outline">
                              {pair?.sire?.breed || pair?.breed1 || "Unknown"} ×{" "}
                              {pair?.dam?.breed || pair?.breed2 || "Unknown"}
                            </Badge>
                          ))}
                        {(!project.pairs || project.pairs.length === 0) && (
                          <span className="text-sm text-gray-500">
                            No breeding pairs
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      className={
                        project.status === "Active" ||
                        project.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {project.status || "Pending"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {projects.length === 0 && (
              <p className="text-center text-gray-500">
                No active breeding projects
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BreedingTracker;

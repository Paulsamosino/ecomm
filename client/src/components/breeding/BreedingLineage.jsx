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
  GitBranch, 
  GitMerge, 
  GitCommit, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  Info,
  Download,
  Share2 
} from "lucide-react";
import ReactFlow, { 
  Controls, 
  Background, 
  MiniMap, 
  MarkerType,
  Panel 
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom node components
const BreedNode = ({ data }) => {
  return (
    <div className="bg-white rounded-md border shadow-sm p-3 min-w-[180px]">
      <div className="font-medium text-sm">{data.breed}</div>
      <div className="text-xs text-muted-foreground">{data.id}</div>
      {data.traits && (
        <div className="mt-2 flex flex-wrap gap-1">
          {Object.entries(data.traits).slice(0, 2).map(([key, value]) => (
            <Badge key={key} variant="outline" className="text-xs">
              {key}: {value}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

const CrossNode = ({ data }) => {
  return (
    <div className="bg-primary/10 rounded-md border border-primary/20 shadow-sm p-3 min-w-[180px]">
      <div className="font-medium text-sm flex items-center">
        <GitMerge className="h-3 w-3 mr-1" />
        Cross: {data.id}
      </div>
      <div className="text-xs text-muted-foreground">{data.date}</div>
      {data.result && (
        <div className="mt-2">
          <Badge variant="secondary" className="text-xs">
            Success: {data.result.success ? "Yes" : "No"}
          </Badge>
        </div>
      )}
    </div>
  );
};

const OffspringNode = ({ data }) => {
  return (
    <div className="bg-green-50 rounded-md border border-green-200 shadow-sm p-3 min-w-[180px]">
      <div className="font-medium text-sm flex items-center">
        <GitCommit className="h-3 w-3 mr-1" />
        {data.breed}
      </div>
      <div className="text-xs text-muted-foreground">ID: {data.id}</div>
      <div className="text-xs text-muted-foreground">Born: {data.date}</div>
      {data.traits && (
        <div className="mt-2 flex flex-wrap gap-1">
          {Object.entries(data.traits).slice(0, 2).map(([key, value]) => (
            <Badge key={key} variant="outline" className="text-xs">
              {key}: {value}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

// Node types configuration
const nodeTypes = {
  breed: BreedNode,
  cross: CrossNode,
  offspring: OffspringNode,
};

const BreedingLineage = ({ projectId = null }) => {
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || "");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadProject(selectedProjectId);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      const data = await breedingService.getBreedingProjects();
      setProjects(data);
      
      // If projectId is provided, set it as selected
      if (projectId && !selectedProjectId) {
        setSelectedProjectId(projectId);
      } else if (data.length > 0 && !selectedProjectId) {
        // Otherwise select the first project
        setSelectedProjectId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  const loadProject = async (id) => {
    setIsLoading(true);
    try {
      const projectData = await breedingService.getBreedingProject(id);
      setProject(projectData);
      
      // Generate lineage graph
      generateLineageGraph(projectData);
    } catch (error) {
      console.error("Failed to load project:", error);
      toast.error("Failed to load project");
    } finally {
      setIsLoading(false);
    }
  };

  const generateLineageGraph = (projectData) => {
    if (!projectData || !projectData.pairs) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const newNodes = [];
    const newEdges = [];
    let nodeId = 1;
    
    // Map to keep track of animal IDs to node IDs
    const animalToNodeMap = {};
    
    // First, create nodes for all parent animals
    projectData.pairs.forEach((pair) => {
      // Add sire node if not already added
      if (!animalToNodeMap[pair.sireId]) {
        const sireNodeId = `animal-${nodeId++}`;
        animalToNodeMap[pair.sireId] = sireNodeId;
        
        newNodes.push({
          id: sireNodeId,
          type: 'breed',
          position: { x: 0, y: 0 }, // Positions will be calculated later
          data: {
            id: pair.sireId,
            breed: pair.breed1,
            gender: 'male',
            traits: pair.sireTraits || {},
          },
        });
      }
      
      // Add dam node if not already added
      if (!animalToNodeMap[pair.damId]) {
        const damNodeId = `animal-${nodeId++}`;
        animalToNodeMap[pair.damId] = damNodeId;
        
        newNodes.push({
          id: damNodeId,
          type: 'breed',
          position: { x: 0, y: 0 },
          data: {
            id: pair.damId,
            breed: pair.breed2,
            gender: 'female',
            traits: pair.damTraits || {},
          },
        });
      }
      
      // Add cross node
      const crossNodeId = `cross-${nodeId++}`;
      newNodes.push({
        id: crossNodeId,
        type: 'cross',
        position: { x: 0, y: 0 },
        data: {
          id: pair.id,
          date: new Date(pair.startDate).toLocaleDateString(),
          result: {
            success: pair.status === 'hatched' || pair.status === 'completed',
          },
        },
      });
      
      // Add edges from parents to cross
      newEdges.push({
        id: `edge-${animalToNodeMap[pair.sireId]}-${crossNodeId}`,
        source: animalToNodeMap[pair.sireId],
        target: crossNodeId,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      });
      
      newEdges.push({
        id: `edge-${animalToNodeMap[pair.damId]}-${crossNodeId}`,
        source: animalToNodeMap[pair.damId],
        target: crossNodeId,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      });
      
      // Add offspring nodes if any
      if (pair.offspring && pair.offspring.length > 0) {
        pair.offspring.forEach((offspring, index) => {
          const offspringNodeId = `offspring-${nodeId++}`;
          
          // Add offspring node
          newNodes.push({
            id: offspringNodeId,
            type: 'offspring',
            position: { x: 0, y: 0 },
            data: {
              id: offspring.id,
              breed: `${pair.breed1} × ${pair.breed2}`,
              date: new Date(offspring.birthDate).toLocaleDateString(),
              traits: offspring.traits || {},
            },
          });
          
          // Add edge from cross to offspring
          newEdges.push({
            id: `edge-${crossNodeId}-${offspringNodeId}`,
            source: crossNodeId,
            target: offspringNodeId,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          });
          
          // If this offspring is used in another pair, update the map
          if (offspring.id in animalToNodeMap) {
            animalToNodeMap[offspring.id] = offspringNodeId;
          }
        });
      }
    });
    
    // Calculate positions using a simple tree layout
    const layoutNodes = calculateNodePositions(newNodes, newEdges);
    
    setNodes(layoutNodes);
    setEdges(newEdges);
  };

  const calculateNodePositions = (nodes, edges) => {
    // This is a simplified layout algorithm
    // For a production app, you might want to use a more sophisticated layout algorithm
    
    // Find root nodes (nodes with no incoming edges)
    const nodeInDegree = {};
    nodes.forEach(node => {
      nodeInDegree[node.id] = 0;
    });
    
    edges.forEach(edge => {
      if (nodeInDegree[edge.target] !== undefined) {
        nodeInDegree[edge.target]++;
      }
    });
    
    const rootNodes = nodes.filter(node => nodeInDegree[node.id] === 0);
    
    // BFS to assign levels and positions
    const nodeLevel = {};
    const nodeLevelPosition = {};
    
    // Initialize level counters
    rootNodes.forEach((node, index) => {
      nodeLevel[node.id] = 0;
      if (!nodeLevelPosition[0]) {
        nodeLevelPosition[0] = 0;
      }
      
      // Position root nodes horizontally with spacing
      node.position = { 
        x: index * 250, 
        y: 0 
      };
    });
    
    // Process each node level by level
    const queue = [...rootNodes];
    while (queue.length > 0) {
      const currentNode = queue.shift();
      const currentLevel = nodeLevel[currentNode.id];
      
      // Find all children of the current node
      const childEdges = edges.filter(edge => edge.source === currentNode.id);
      
      childEdges.forEach((edge, index) => {
        const childNode = nodes.find(node => node.id === edge.target);
        if (childNode) {
          const childLevel = currentLevel + 1;
          nodeLevel[childNode.id] = childLevel;
          
          // Initialize level position counter if not exists
          if (!nodeLevelPosition[childLevel]) {
            nodeLevelPosition[childLevel] = 0;
          }
          
          // Position child node
          childNode.position = {
            x: currentNode.position.x + (index - childEdges.length / 2) * 200,
            y: childLevel * 150
          };
          
          queue.push(childNode);
        }
      });
    }
    
    return nodes;
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleSearch = () => {
    if (!searchQuery) return;
    
    // Find node that matches the search query
    const foundNode = nodes.find(node => 
      node.data.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (node.data.breed && node.data.breed.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    if (foundNode) {
      // Center view on the found node
      if (reactFlowInstance) {
        reactFlowInstance.fitView({
          nodes: [foundNode],
          padding: 0.2,
        });
      }
    } else {
      toast.error("No matches found");
    }
  };

  const exportLineage = () => {
    // Create a JSON representation of the lineage
    const lineageData = {
      project: project,
      nodes: nodes,
      edges: edges,
    };
    
    // Convert to JSON string
    const jsonString = JSON.stringify(lineageData, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name}-lineage.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Lineage data exported successfully");
  };

  let reactFlowInstance;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <GitBranch className="h-6 w-6" />
          Breeding Lineage
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select 
            value={selectedProjectId} 
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <p>Loading lineage data...</p>
        </div>
      ) : !project ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Info className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Project Selected</h3>
            <p className="text-center text-muted-foreground mb-4">
              Select a breeding project to view its lineage
            </p>
          </CardContent>
        </Card>
      ) : nodes.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <GitBranch className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Lineage Data</h3>
            <p className="text-center text-muted-foreground mb-4">
              This project doesn't have any breeding pairs or offspring yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle>{project.name} Lineage</CardTitle>
            <CardDescription>
              Visualize breeding relationships and offspring
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 p-4 border-b">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID or breed..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleSearch}>
                Find
              </Button>
              <div className="flex items-center ml-auto">
                <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="mx-2 text-sm">{Math.round(zoomLevel * 100)}%</span>
                <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={exportLineage} title="Export lineage data">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div style={{ height: '600px' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onInit={(instance) => { reactFlowInstance = instance; }}
                fitView
                minZoom={0.5}
                maxZoom={2}
                defaultZoom={zoomLevel}
                attributionPosition="bottom-left"
              >
                <Controls />
                <MiniMap 
                  nodeStrokeWidth={3}
                  zoomable
                  pannable
                />
                <Background color="#f8f9fa" gap={16} />
              </ReactFlow>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 p-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-white border rounded-sm"></div>
                <span>Parent</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-primary/10 border border-primary/20 rounded-sm"></div>
                <span>Cross</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-50 border border-green-200 rounded-sm"></div>
                <span>Offspring</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default BreedingLineage;

import axiosInstance from "./axiosInstance";
import { breedDatabase, breedCombinations } from "@/data/breedDatabase";
import { toast } from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Breeding Service - Provides methods to interact with breeding-related data.
 * Has fallback mechanisms to use localStorage when backend API is not available.
 */
export class BreedingService {
  constructor() {
    this.useLocalDatabase = process.env.NODE_ENV === "development";
    this.initLocalStorage();
  }

  /**
   * Initialize local storage with default values if empty
   */
  initLocalStorage() {
    if (!localStorage.getItem("breedingPairs")) {
      localStorage.setItem("breedingPairs", JSON.stringify([]));
    }
  }

  /**
   * Handle API errors consistently with improved error messages
   */
  handleApiError(error, fallbackData = null, silent = false) {
    // Don't log 404 errors in development
    if (
      process.env.NODE_ENV === "development" &&
      error.response?.status === 404
    ) {
      console.log("API endpoint not available, using fallback data");
      return fallbackData;
    }

    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred";
    console.error("API Error:", error);
    if (!silent) {
      toast.error(errorMessage);
    }
    return fallbackData;
  }

  // ===============================================================
  // PROJECT MANAGEMENT
  // ===============================================================

  /**
   * Get all breeding projects for the current user
   */
  async getBreedingProjects() {
    try {
      if (this.useLocalDatabase) {
        return JSON.parse(localStorage.getItem("breedingProjects")) || [];
      }

      const response = await axiosInstance.get(
        `${API_URL}/api/breeding/projects`
      );
      return response.data;
    } catch (error) {
      return this.handleApiError(error, this.getMockBreedingProjects());
    }
  }

  /**
   * Get a specific breeding project by ID
   */
  async getBreedingProject(projectId) {
    try {
      if (this.useLocalDatabase) {
        const projects =
          JSON.parse(localStorage.getItem("breedingProjects")) || [];
        return projects.find((p) => p.id === projectId);
      }

      const response = await axiosInstance.get(
        `${API_URL}/api/breeding/projects/${projectId}`
      );
      return response.data;
    } catch (error) {
      return this.handleApiError(error, null);
    }
  }

  /**
   * Create a new breeding project
   */
  async createBreedingProject(projectData) {
    try {
      if (this.useLocalDatabase) {
        const projects =
          JSON.parse(localStorage.getItem("breedingProjects")) || [];
        const newProject = {
          id: Date.now().toString(),
          ...projectData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pairs: [],
          status: "active",
        };

        const updatedProjects = [...projects, newProject];
        localStorage.setItem(
          "breedingProjects",
          JSON.stringify(updatedProjects)
        );

        return newProject;
      }

      const response = await axiosInstance.post(
        `${API_URL}/api/breeding/projects`,
        projectData
      );
      return response.data;
    } catch (error) {
      return this.handleApiError(error, null);
    }
  }

  /**
   * Update an existing breeding project
   */
  async updateBreedingProject(projectId, projectData) {
    try {
      if (this.useLocalDatabase) {
        const projects =
          JSON.parse(localStorage.getItem("breedingProjects")) || [];
        const updatedProjects = projects.map((project) =>
          project.id === projectId
            ? {
                ...project,
                ...projectData,
                updatedAt: new Date().toISOString(),
              }
            : project
        );

        localStorage.setItem(
          "breedingProjects",
          JSON.stringify(updatedProjects)
        );
        return updatedProjects.find((p) => p.id === projectId);
      }

      const response = await axiosInstance.put(
        `${API_URL}/api/breeding/projects/${projectId}`,
        projectData
      );
      return response.data;
    } catch (error) {
      return this.handleApiError(error, null);
    }
  }

  /**
   * Delete a breeding project
   */
  async deleteBreedingProject(projectId) {
    try {
      if (this.useLocalDatabase) {
        const projects =
          JSON.parse(localStorage.getItem("breedingProjects")) || [];
        const updatedProjects = projects.filter(
          (project) => project.id !== projectId
        );
        localStorage.setItem(
          "breedingProjects",
          JSON.stringify(updatedProjects)
        );
        return { success: true };
      }

      await axiosInstance.delete(
        `${API_URL}/api/breeding/projects/${projectId}`
      );
      return { success: true };
    } catch (error) {
      return this.handleApiError(error, { success: false });
    }
  }

  /**
   * Delete a breeding pair
   */
  async deleteBreedingPair(pairId) {
    try {
      if (this.useLocalDatabase) {
        const pairs = JSON.parse(localStorage.getItem("breedingPairs")) || [];
        const updatedPairs = pairs.filter((pair) => pair.id !== pairId);
        localStorage.setItem("breedingPairs", JSON.stringify(updatedPairs));
        return { success: true };
      }

      await axiosInstance.delete(`${API_URL}/api/breeding/pairs/${pairId}`);
      return { success: true };
    } catch (error) {
      return this.handleApiError(error, { success: false });
    }
  }

  /**
   * Add a breeding pair to a project
   */
  async addBreedingPairToProject(projectId, pairId) {
    try {
      if (this.useLocalDatabase) {
        const projects =
          JSON.parse(localStorage.getItem("breedingProjects")) || [];
        const pairs = JSON.parse(localStorage.getItem("breedingPairs")) || [];

        const pair = pairs.find((p) => p.id === pairId);
        if (!pair) return null;

        const updatedProjects = projects.map((project) => {
          if (project.id === projectId) {
            return {
              ...project,
              pairs: [...project.pairs, pairId],
              updatedAt: new Date().toISOString(),
            };
          }
          return project;
        });

        localStorage.setItem(
          "breedingProjects",
          JSON.stringify(updatedProjects)
        );
        return updatedProjects.find((p) => p.id === projectId);
      }

      const response = await axiosInstance.post(
        `${API_URL}/api/breeding/projects/${projectId}/pairs`,
        { pairId }
      );
      return response.data;
    } catch (error) {
      return this.handleApiError(error, null);
    }
  }

  /**
   * Add a generation to a breeding project
   */
  async addGeneration(projectId, generationData) {
    try {
      if (this.useLocalDatabase) {
        const projects =
          JSON.parse(localStorage.getItem("breedingProjects")) || [];

        const updatedProjects = projects.map((project) => {
          if (project.id === projectId) {
            const generations = project.generations || [];
            const newGeneration = {
              id: Date.now().toString(),
              number: generations.length + 1,
              ...generationData,
              pairs: [],
              createdAt: new Date().toISOString(),
            };

            return {
              ...project,
              generations: [...generations, newGeneration],
              updatedAt: new Date().toISOString(),
            };
          }
          return project;
        });

        localStorage.setItem(
          "breedingProjects",
          JSON.stringify(updatedProjects)
        );
        const updatedProject = updatedProjects.find((p) => p.id === projectId);
        const newGeneration =
          updatedProject.generations[updatedProject.generations.length - 1];
        return newGeneration;
      }

      const response = await axiosInstance.post(
        `${API_URL}/api/breeding/projects/${projectId}/generations`,
        generationData
      );
      return response.data;
    } catch (error) {
      return this.handleApiError(error, null);
    }
  }

  // ===============================================================
  // BREEDING PAIR MANAGEMENT
  // ===============================================================

  /**
   * Get all breeding pairs for the current user
   */
  async getBreedingPairs() {
    try {
      if (this.useLocalDatabase) {
        return JSON.parse(localStorage.getItem("breedingPairs")) || [];
      }

      const response = await axiosInstance.get(`${API_URL}/api/breeding/pairs`);
      return response.data;
    } catch (error) {
      return this.handleApiError(error, []);
    }
  }

  /**
   * Get active breeding pairs
   */
  async getActiveBreedingPairs() {
    try {
      if (this.useLocalDatabase) {
        const pairs = JSON.parse(localStorage.getItem("breedingPairs")) || [];
        return pairs.filter((pair) => pair.status === "active");
      }

      const response = await axiosInstance.get(
        `${API_URL}/api/breeding/pairs/active`
      );
      return response.data;
    } catch (error) {
      return this.handleApiError(error, this.getMockActiveBreedingPairs());
    }
  }

  /**
   * Create a new breeding pair
   */
  async createBreedingPair(pairData) {
    try {
      if (this.useLocalDatabase) {
        const pairs = JSON.parse(localStorage.getItem("breedingPairs")) || [];
        const stock = await this.getBreedingStock();

        // Find the actual stock items if provided by id
        const sire = pairData.sireId
          ? stock.find((s) => s.id === pairData.sireId)
          : stock.find((s) => s.sex === "male" && s.breed === pairData.breed1);

        const dam = pairData.damId
          ? stock.find((s) => s.id === pairData.damId)
          : stock.find(
              (s) => s.sex === "female" && s.breed === pairData.breed2
            );

        if (!sire || !dam) {
          console.error("Could not find suitable breeding stock");
          return null;
        }

        const newPair = {
          id: Date.now().toString(),
          name: `${sire.breed} × ${dam.breed}`,
          sire: { id: sire.id, breed: sire.breed },
          dam: { id: dam.id, breed: dam.breed },
          breed1: sire.breed,
          breed2: dam.breed,
          result:
            pairData.result ||
            this.calculateBreedingCompatibility(sire.breed, dam.breed),
          status: "active",
          startDate: new Date().toISOString(),
          expectedHatchDate: this.calculateExpectedHatchDate(
            pairData.incubationPeriod || 21
          ),
          events: [],
          notes: pairData.notes || "",
          project: pairData.projectId,
        };

        const updatedPairs = [...pairs, newPair];
        localStorage.setItem("breedingPairs", JSON.stringify(updatedPairs));

        // If a project was specified, add the pair to it
        if (pairData.projectId) {
          await this.addBreedingPairToProject(pairData.projectId, newPair.id);
        }

        return newPair;
      }

      const response = await axiosInstance.post(
        `${API_URL}/api/breeding/pairs`,
        pairData
      );
      return response.data;
    } catch (error) {
      return this.handleApiError(error, null);
    }
  }

  /**
   * Get a specific breeding pair
   */
  async getBreedingPair(pairId) {
    try {
      if (this.useLocalDatabase) {
        const pairs = JSON.parse(localStorage.getItem("breedingPairs")) || [];
        return pairs.find((p) => p.id === pairId);
      }

      const response = await axiosInstance.get(
        `${API_URL}/api/breeding/pairs/${pairId}`
      );
      return response.data;
    } catch (error) {
      return this.handleApiError(error, null);
    }
  }

  /**
   * Update breeding pair status
   */
  async updateBreedingPairStatus(pairId, status) {
    try {
      if (this.useLocalDatabase) {
        const pairs = JSON.parse(localStorage.getItem("breedingPairs")) || [];
        const updatedPairs = pairs.map((pair) => {
          if (pair.id === pairId) {
            return {
              ...pair,
              status,
              ...(status === "completed"
                ? { completionDate: new Date().toISOString() }
                : {}),
            };
          }
          return pair;
        });

        localStorage.setItem("breedingPairs", JSON.stringify(updatedPairs));
        return updatedPairs.find((p) => p.id === pairId);
      }

      const response = await axiosInstance.put(
        `${API_URL}/api/breeding/pairs/${pairId}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      return this.handleApiError(error, null);
    }
  }

  /**
   * Add event to breeding pair
   */
  async addBreedingEvent(pairId, eventData) {
    try {
      if (this.useLocalDatabase) {
        const pairs = JSON.parse(localStorage.getItem("breedingPairs")) || [];
        const updatedPairs = pairs.map((pair) => {
          if (pair.id === pairId) {
            const newEvent = {
              id: Date.now().toString(),
              date: new Date().toISOString(),
              ...eventData,
            };

            return {
              ...pair,
              events: [...(pair.events || []), newEvent],
            };
          }
          return pair;
        });

        localStorage.setItem("breedingPairs", JSON.stringify(updatedPairs));
        return updatedPairs.find((p) => p.id === pairId);
      }

      const response = await axiosInstance.post(
        `${API_URL}/api/breeding/pairs/${pairId}/events`,
        eventData
      );
      return response.data;
    } catch (error) {
      return this.handleApiError(error, null);
    }
  }

  /**
   * Calculate expected hatch date based on current date and incubation period
   */
  calculateExpectedHatchDate(incubationPeriod = 21) {
    const date = new Date();
    date.setDate(date.getDate() + incubationPeriod);
    return date.toISOString();
  }

  // ===============================================================
  // BREEDING STOCK MANAGEMENT
  // ===============================================================

  /**
   * Get breeding stock (suitable animals for breeding)
   */
  async getBreedingStock() {
    try {
      if (this.useLocalDatabase) {
        return this.getMockBreedingStock();
      }

      const response = await axiosInstance.get(
        `${API_URL}/api/inventory/breeding-stock`
      );
      return response.data.map((stock) => ({
        ...stock,
        // Ensure all stock has a sex property if not provided
        sex: stock.sex || this.guessSex(stock),
      }));
    } catch (error) {
      const fallbackStock = this.getMockBreedingStock();
      return this.handleApiError(error, fallbackStock);
    }
  }

  /**
   * Get breeds available for a specific category (chicken, duck, etc.)
   */ async getBreedsByCategory(category) {
    try {
      if (this.useLocalDatabase) {
        // If category is equipment or other, return empty array since they don't have breeds
        if (category === "equipment" || category === "other") {
          return [];
        }

        // Filter breeds only for livestock categories
        return Object.keys(breedDatabase).filter((breedName) => {
          const breed = breedDatabase[breedName];
          if (category === "chicken") {
            return (
              breed.category === "Pure Breed" ||
              (breed.category === "Hybrid/Crossbreed" &&
                !breed.description?.toLowerCase().includes("duck") &&
                !breed.description?.toLowerCase().includes("turkey"))
            );
          }
          if (category === "duck") {
            return breed.description?.toLowerCase().includes("duck");
          }
          if (category === "turkey") {
            return breed.description?.toLowerCase().includes("turkey");
          }
          return false;
        });
      }

      const response = await axiosInstance.get(
        `${API_URL}/api/breeding/breeds/${category}`
      );
      return response.data;
    } catch (error) {
      // Fallback to extracting breed names from breedDatabase
      try {
        const stock = await this.getBreedingStock();
        const breeds = [
          ...new Set(
            stock
              .filter((item) => item.category === category)
              .map((item) => item.breed)
          ),
        ];
        return this.handleApiError(error, breeds);
      } catch (innerError) {
        // Last resort fallback
        return this.handleApiError(
          error,
          Object.keys(breedDatabase).slice(0, 10)
        );
      }
    }
  }

  /**
   * Get all breeds
   */
  async getBreeds() {
    try {
      if (this.useLocalDatabase) {
        return Object.keys(breedDatabase);
      }

      const response = await axiosInstance.get(
        `${API_URL}/api/breeding/breeds`
      );
      return response.data;
    } catch (error) {
      try {
        // Fallback to extracting breed names from stock
        const stock = await this.getBreedingStock();
        const breeds = [...new Set(stock.map((item) => item.breed))];
        return this.handleApiError(error, breeds);
      } catch (innerError) {
        // Last resort fallback
        return this.handleApiError(error, Object.keys(breedDatabase));
      }
    }
  }

  // ===============================================================
  // BREEDING CALCULATIONS & ANALYTICS
  // ===============================================================

  /**
   * Calculate breeding compatibility between two breeds
   */
  async calculateBreedingCompatibility(breed1, breed2) {
    try {
      // Check predefined combinations first
      const combinationKey = `${breed1} × ${breed2}`;
      const reverseCombinationKey = `${breed2} × ${breed1}`;

      if (breedCombinations[combinationKey]) {
        return breedCombinations[combinationKey];
      } else if (breedCombinations[reverseCombinationKey]) {
        return breedCombinations[reverseCombinationKey];
      }

      if (this.useLocalDatabase) {
        return this.calculateLocalBreedingCompatibility(breed1, breed2);
      }

      const response = await axiosInstance.post(
        `${API_URL}/api/breeding/calculate`,
        {
          breed1,
          breed2,
        }
      );
      return response.data;
    } catch (error) {
      const result = this.calculateLocalBreedingCompatibility(breed1, breed2);
      return this.handleApiError(error, result, true);
    }
  }

  /**
   * Calculate local breeding compatibility using breedDatabase
   */
  calculateLocalBreedingCompatibility(breed1, breed2) {
    const breed1Data = breedDatabase[breed1];
    const breed2Data = breedDatabase[breed2];

    if (!breed1Data || !breed2Data) {
      return {
        name: `${breed1}-${breed2} Cross`,
        characteristics: "Custom hybrid cross with unknown traits",
        expectedTraits: {
          eggProduction: "Variable",
          eggColor: "Variable",
          temperament: "Variable",
          meatQuality: "Variable",
          hybridVigor: "Unknown",
        },
        breedingConsiderations: [
          "Monitor offspring characteristics",
          "Keep detailed records",
        ],
      };
    }

    const predictTemperament = (temp1, temp2) => {
      if (!temp1 || !temp2) return "Variable";

      const calmTerms = ["calm", "docile", "gentle", "friendly"];
      const activeTerms = ["active", "flighty", "alert"];

      const temp1Lower = temp1.toLowerCase();
      const temp2Lower = temp2.toLowerCase();

      const temp1Calm = calmTerms.some((term) => temp1Lower.includes(term));
      const temp2Calm = calmTerms.some((term) => temp2Lower.includes(term));
      const temp1Active = activeTerms.some((term) => temp1Lower.includes(term));
      const temp2Active = activeTerms.some((term) => temp2Lower.includes(term));

      if (temp1Calm && temp2Calm) return "Very docile";
      if (temp1Active && temp2Active) return "Very active";
      if ((temp1Calm && temp2Active) || (temp1Active && temp2Calm)) {
        return "Moderately active, balanced temperament";
      }

      return `Mixed (${temp1} × ${temp2})`;
    };

    const predictEggColor = (color1, color2) => {
      if (!color1 || !color2) return "Variable";
      if (color1 === color2) return color1;
      return `Variable (${color1} to ${color2})`;
    };

    const calculateHybridVigor = (val1, val2) => {
      if (!val1 || !val2) return 0;
      const average = (val1 + val2) / 2;
      const boost = average * (Math.random() * 0.1 + 0.05); // 5-15% boost
      return Math.round(average + boost);
    };

    const predictSize = (weight1, weight2) => {
      if (!weight1 || !weight2) return "Variable";

      const extractWeights = (weightStr) => {
        const matches = weightStr.match(/Male: ([\d.]+)[^\d]+([\d.]+)/);
        return matches
          ? [parseFloat(matches[1]), parseFloat(matches[2])]
          : null;
      };

      const weights1 = extractWeights(weight1);
      const weights2 = extractWeights(weight2);

      if (!weights1 || !weights2) return "Variable";

      const avgMale = (weights1[0] + weights2[0]) / 2;
      const avgFemale = (weights1[1] + weights2[1]) / 2;

      return `Male: ~${avgMale.toFixed(1)} lbs, Female: ~${avgFemale.toFixed(
        1
      )} lbs`;
    };

    return {
      name: `${breed1}-${breed2} Cross`,
      characteristics: "Hybrid with predicted traits based on parent breeds",
      expectedTraits: {
        eggProduction:
          breed1Data.eggProduction && breed2Data.eggProduction
            ? `${calculateHybridVigor(
                parseInt(breed1Data.eggProduction),
                parseInt(breed2Data.eggProduction)
              )} eggs per year (estimated)`
            : "Variable",
        eggColor: predictEggColor(breed1Data.eggColor, breed2Data.eggColor),
        temperament: predictTemperament(
          breed1Data.temperament,
          breed2Data.temperament
        ),
        meatQuality:
          breed1Data.type === "Meat" || breed2Data.type === "Meat"
            ? "Good"
            : "Moderate",
        size: predictSize(breed1Data.weight, breed2Data.weight),
      },
      breedingConsiderations: [
        `Climate adaptability: ${breed1Data.climate || "Variable"} × ${
          breed2Data.climate || "Variable"
        }`,
        `Broodiness tendency: ${breed1Data.broodiness || "Variable"} × ${
          breed2Data.broodiness || "Variable"
        }`,
        "Monitor first generation for trait expression",
        "Consider parent breed strengths",
      ],
      parentBreeds: {
        breed1: { name: breed1, traits: breed1Data },
        breed2: { name: breed2, traits: breed2Data },
      },
    };
  }
}

// Export a singleton instance
export const breedingService = new BreedingService();
export default breedingService;

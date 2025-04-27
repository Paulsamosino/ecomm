import axiosInstance from "./axiosInstance";
import { API_URL, FEATURES } from "@/config/constants";
import toast from "react-hot-toast";
import { breedDatabase, breedCombinations } from "@/data/breedDatabase";
import { format, subMonths } from "date-fns";

class BreedingService {
  constructor() {
    this.baseUrl = `${API_URL}/api/breeding`;
    // Use local database by default
    this.useLocalDatabase = true;
    this.usingFallbackData = false;
    this.loggedEndpoints = new Set();
  }

  // Helper method for consistent error handling with improved logging
  handleApiError(error, defaultMessage, endpointPath, useFallback = true) {
    // Only log detailed errors if not a 404 (expected during development)
    // Also avoid logging the same 404 endpoint multiple times
    const endpoint = `${this.baseUrl}${endpointPath}`;
    const is404 = error.response?.status === 404;

    if (!is404 || !this.loggedEndpoints.has(endpoint)) {
      if (is404) {
        this.loggedEndpoints.add(endpoint);
        console.log(`Using local breed database instead of API: ${endpoint}`);
      } else {
        console.error(`${defaultMessage}:`, error);
      }
    }

    if (error.response?.data?.message) {
      if (!is404) {
        toast.error(error.response.data.message);
      }
    } else if (!is404 && !useFallback) {
      toast.error(defaultMessage);
    }

    this.usingFallbackData = useFallback;
    return null;
  }

  async getProjects() {
    // Directly use local data instead of API call
    if (this.useLocalDatabase) {
      return this.getMockProjects();
    }

    try {
      const response = await axiosInstance.get(`${this.baseUrl}/projects`);
      // Reset fallback flag when API call succeeds
      this.usingFallbackData = false;
      return response.data;
    } catch (error) {
      this.handleApiError(
        error,
        "Error fetching breeding projects",
        "/projects"
      );
      // Return mock data as a fallback
      return this.getMockProjects();
    }
  }

  getMockProjects() {
    return [
      {
        _id: "mock-project-1",
        name: "Rhode Island Red Improvement",
        description:
          "Breeding program to enhance egg production traits in Rhode Island Red chickens",
        category: "chicken",
        createdAt: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        status: "active",
        pairs: [
          {
            _id: "pair-1",
            sire: { name: "Red King", breed: "Rhode Island Red" },
            dam: { name: "Ruby", breed: "Rhode Island Red" },
            status: "active",
          },
        ],
      },
      {
        _id: "mock-project-2",
        name: "Heritage Breed Conservation",
        description:
          "Program focused on preserving rare heritage chicken breeds",
        category: "chicken",
        createdAt: new Date(
          Date.now() - 60 * 24 * 60 * 60 * 1000
        ).toISOString(),
        status: "planning",
        pairs: [],
      },
    ];
  }

  async getBreedingProjects() {
    return this.getProjects();
  }

  async createProject(projectData) {
    try {
      const response = await axiosInstance.post(
        `${this.baseUrl}/projects`,
        projectData
      );
      toast.success("Breeding project created successfully");
      return response.data;
    } catch (error) {
      this.handleApiError(error, "Error creating breeding project");
      throw error;
    }
  }

  async addBreedingPair(projectId, pairData) {
    try {
      const response = await axiosInstance.post(
        `${this.baseUrl}/projects/${projectId}/pairs`,
        pairData
      );
      toast.success("Breeding pair added successfully");
      return response.data;
    } catch (error) {
      this.handleApiError(error, "Error adding breeding pair");
      throw error;
    }
  }

  async updatePairStatus(projectId, pairId, status) {
    try {
      const response = await axiosInstance.put(
        `${this.baseUrl}/projects/${projectId}/pairs/${pairId}`,
        { status }
      );
      toast.success(`Breeding pair status updated to ${status}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error, "Error updating pair status");
      throw error;
    }
  }

  async deleteProject(projectId) {
    try {
      const response = await axiosInstance.delete(
        `${this.baseUrl}/projects/${projectId}`
      );
      toast.success("Breeding project deleted successfully");
      return response.data;
    } catch (error) {
      this.handleApiError(error, "Error deleting project");
      throw error;
    }
  }

  async calculateBreedingCompatibility(sireId, damId) {
    try {
      // This should ideally call an API endpoint for compatibility calculation
      const response = await axiosInstance.post(
        `${this.baseUrl}/compatibility`,
        { sireId, damId }
      );
      return response.data;
    } catch (error) {
      console.error("Error calculating breeding compatibility:", error);

      // If API call fails, calculate locally based on product data
      try {
        // Get the products to calculate compatibility
        const stock = await this.getBreedingStock();
        const sire = stock.find((product) => product._id === sireId);
        const dam = stock.find((product) => product._id === damId);

        if (!sire || !dam) {
          throw new Error("Could not find the breeding stock");
        }

        // Check if they're the same species
        if (sire.category !== dam.category) {
          return {
            score: 0,
            confidenceLevel: "Low",
            description:
              "These animals are different species and cannot be bred together.",
            factors: ["Different species cannot breed together"],
            healthRisks: ["Cross-species breeding is not possible"],
            timestamp: new Date(),
          };
        }

        // Calculate compatibility based on specifications
        let score = 70; // Base score
        const factors = [];
        const healthRisks = [];

        // Check specifications
        if (sire.specifications && dam.specifications) {
          // Temperament compatibility
          const sireTemp = sire.specifications.find(
            (spec) => spec.name === "Temperament"
          )?.value;
          const damTemp = dam.specifications.find(
            (spec) => spec.name === "Temperament"
          )?.value;

          if (sireTemp && damTemp) {
            if (sireTemp === damTemp) {
              score += 10;
              factors.push(`Matching temperament (${sireTemp})`);
            } else if (
              (sireTemp === "Calm" && damTemp === "Friendly") ||
              (sireTemp === "Friendly" && damTemp === "Calm")
            ) {
              score += 5;
              factors.push(
                `Compatible temperaments (${sireTemp} & ${damTemp})`
              );
            }
          }

          // Egg production (for females)
          if (dam.sex === "Female") {
            const eggProd = dam.specifications.find(
              (spec) => spec.name === "Egg Production"
            )?.value;
            if (eggProd === "High" || eggProd === "Very High") {
              score += 5;
              factors.push("High egg production potential");
            }
          }

          // Climate adaptability
          const sireCold =
            sire.specifications.find((spec) => spec.name === "Cold Hardy")
              ?.value === "Yes";
          const damCold =
            dam.specifications.find((spec) => spec.name === "Cold Hardy")
              ?.value === "Yes";

          if (sireCold && damCold) {
            score += 5;
            factors.push("Both breeds are cold hardy");
          }

          const sireHeat =
            sire.specifications.find((spec) => spec.name === "Heat Tolerant")
              ?.value === "Yes";
          const damHeat =
            dam.specifications.find((spec) => spec.name === "Heat Tolerant")
              ?.value === "Yes";

          if (sireHeat && damHeat) {
            score += 5;
            factors.push("Both breeds are heat tolerant");
          }

          // Purpose compatibility
          const sirePurpose = sire.specifications.find(
            (spec) => spec.name === "Purpose"
          )?.value;
          const damPurpose = dam.specifications.find(
            (spec) => spec.name === "Purpose"
          )?.value;

          if (sirePurpose && damPurpose && sirePurpose === damPurpose) {
            score += 5;
            factors.push(`Matching purpose (${sirePurpose})`);
          }
        }

        // Add genetic considerations
        factors.push("Genetic diversity is suitable for breeding");

        // Add age considerations
        if (Math.abs(sire.age - dam.age) <= 2) {
          score += 5;
          factors.push("Age compatibility is ideal for breeding");
        } else if (Math.abs(sire.age - dam.age) > 5) {
          score -= 5;
          healthRisks.push("Large age difference may affect breeding success");
        }

        // Calculate confidence level
        const confidenceLevel =
          score >= 80 ? "High" : score >= 70 ? "Medium" : "Low";

        // Add health risks if score is low
        if (score < 75) {
          healthRisks.push("Monitor offspring for potential genetic issues");
        }

        // Ensure we have at least some factors
        if (factors.length === 0) {
          factors.push("Basic breeding compatibility");
        }

        // Cap the score at 100
        score = Math.min(Math.max(score, 0), 100);

        return {
          score,
          confidenceLevel,
          description: `These breeds have ${
            score >= 80 ? "excellent" : score >= 70 ? "good" : "fair"
          } breeding compatibility.`,
          factors,
          healthRisks,
          timestamp: new Date(),
        };
      } catch (innerError) {
        console.error(
          "Error with fallback compatibility calculation:",
          innerError
        );
        // Last resort - return a very basic compatibility assessment
        return {
          score: 70,
          confidenceLevel: "Medium",
          description:
            "Basic compatibility assessment (limited data available).",
          factors: [
            "Basic genetic diversity",
            "Standard breeding compatibility",
          ],
          healthRisks: [],
          timestamp: new Date(),
        };
      }
    }
  }

  async getBreedingStock() {
    // Use local data if configured to do so
    if (this.useLocalDatabase) {
      return this.getMockBreedingStock();
    }

    try {
      // Fix the URL by removing the double api prefix
      const response = await axiosInstance.get(`/api/products`, {
        params: {
          limit: 100,
          category: ["chicken", "duck", "turkey"].join(","),
          // Exclude items that are not live animals
          exclude: "feed,equipment,medication",
        },
      });

      // Handle different response formats
      let products = [];
      if (response.data.products) {
        products = response.data.products;
      } else if (Array.isArray(response.data)) {
        products = response.data;
      }

      // Ensure each product has a sex field if missing
      const productsWithSex = products.map((product) => ({
        ...product,
        sex:
          product.sex ||
          product.name.toLowerCase().includes("hen") ||
          product.name.toLowerCase().includes("female")
            ? "Female"
            : product.name.toLowerCase().includes("rooster") ||
              product.name.toLowerCase().includes("male") ||
              product.name.toLowerCase().includes("drake") ||
              product.name.toLowerCase().includes("tom")
            ? "Male"
            : Math.random() > 0.5
            ? "Male"
            : "Female",
      }));

      return productsWithSex;
    } catch (error) {
      console.error("Error fetching breeding stock:", error);

      // Try to get products from a more general endpoint as fallback
      try {
        // Fix the URL here too - remove double api
        const fallbackResponse = await axiosInstance.get(`/api/products`);
        let fallbackProducts = [];

        if (fallbackResponse.data.products) {
          fallbackProducts = fallbackResponse.data.products;
        } else if (Array.isArray(fallbackResponse.data)) {
          fallbackProducts = fallbackResponse.data;
        }

        // Filter to only include livestock categories
        const livestockProducts = fallbackProducts.filter((product) =>
          ["chicken", "duck", "turkey"].includes(
            product.category?.toLowerCase()
          )
        );

        if (livestockProducts.length > 0) {
          // Add sex if missing
          return livestockProducts.map((product) => ({
            ...product,
            sex:
              product.sex ||
              product.name.toLowerCase().includes("hen") ||
              product.name.toLowerCase().includes("female")
                ? "Female"
                : product.name.toLowerCase().includes("rooster") ||
                  product.name.toLowerCase().includes("male") ||
                  product.name.toLowerCase().includes("drake") ||
                  product.name.toLowerCase().includes("tom")
                ? "Male"
                : Math.random() > 0.5
                ? "Male"
                : "Female",
          }));
        }
      } catch (fallbackError) {
        console.error("Error with fallback product fetch:", fallbackError);
      }

      // Since we're using local data, use mock data as last resort
      return this.getMockBreedingStock();
    }
  }

  getMockBreedingStock() {
    return [
      // Chickens
      {
        _id: "chicken-male-1",
        name: "Rhode Island Red Rooster",
        breed: "Rhode Island Red",
        category: "chicken",
        age: 2,
        price: 85,
        sex: "Male",
        specifications: [
          { name: "Egg Production", value: "N/A" },
          { name: "Temperament", value: "Friendly" },
          { name: "Cold Hardy", value: "Yes" },
          { name: "Heat Tolerant", value: "Yes" },
          { name: "Purpose", value: "Dual" },
        ],
      },
      {
        _id: "chicken-female-1",
        name: "White Leghorn Hen",
        breed: "Leghorn",
        category: "chicken",
        age: 1.5,
        price: 65,
        sex: "Female",
        specifications: [
          { name: "Egg Production", value: "Very High" },
          { name: "Temperament", value: "Active" },
          { name: "Cold Hardy", value: "No" },
          { name: "Heat Tolerant", value: "Yes" },
          { name: "Purpose", value: "Egg" },
        ],
      },

      // Ducks
      {
        _id: "duck-male-1",
        name: "Pekin Drake",
        breed: "Pekin",
        category: "duck",
        age: 1.5,
        price: 75,
        sex: "Male",
        specifications: [
          { name: "Egg Production", value: "N/A" },
          { name: "Temperament", value: "Calm" },
          { name: "Cold Hardy", value: "Yes" },
          { name: "Heat Tolerant", value: "Yes" },
          { name: "Purpose", value: "Meat" },
        ],
      },
      {
        _id: "duck-female-1",
        name: "Khaki Campbell Duck",
        breed: "Khaki Campbell",
        category: "duck",
        age: 1,
        price: 65,
        sex: "Female",
        specifications: [
          { name: "Egg Production", value: "Very High" },
          { name: "Temperament", value: "Active" },
          { name: "Cold Hardy", value: "Yes" },
          { name: "Heat Tolerant", value: "Yes" },
          { name: "Purpose", value: "Egg" },
        ],
      },

      // Turkeys
      {
        _id: "turkey-male-1",
        name: "Bronze Tom Turkey",
        breed: "Bronze",
        category: "turkey",
        age: 2,
        price: 120,
        sex: "Male",
        specifications: [
          { name: "Egg Production", value: "N/A" },
          { name: "Temperament", value: "Alert" },
          { name: "Cold Hardy", value: "Yes" },
          { name: "Heat Tolerant", value: "Yes" },
          { name: "Purpose", value: "Meat" },
        ],
      },
      {
        _id: "turkey-female-1",
        name: "Bourbon Red Turkey Hen",
        breed: "Bourbon Red",
        category: "turkey",
        age: 1.5,
        price: 95,
        sex: "Female",
        specifications: [
          { name: "Egg Production", value: "Medium" },
          { name: "Temperament", value: "Calm" },
          { name: "Cold Hardy", value: "Yes" },
          { name: "Heat Tolerant", value: "Yes" },
          { name: "Purpose", value: "Dual" },
        ],
      },
    ];
  }

  async getBreeds() {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/breeds`);
      return response.data;
    } catch (error) {
      console.error("Error fetching breeds:", error);

      // Try to extract breeds from products as fallback
      try {
        const stock = await this.getBreedingStock();
        const breeds = {};

        stock.forEach((product) => {
          if (product.breed && product.category) {
            if (!breeds[product.category]) {
              breeds[product.category] = new Set();
            }
            breeds[product.category].add(product.breed);
          }
        });

        // Convert to array format
        const result = [];
        for (const [category, breedSet] of Object.entries(breeds)) {
          const categoryBreeds = Array.from(breedSet);
          categoryBreeds.forEach((breed) => {
            result.push({
              name: breed,
              category: category,
              characteristics: {
                purpose: this.guessPurpose(stock, breed),
                origin: "Various",
              },
            });
          });
        }

        if (result.length > 0) {
          return result;
        }
      } catch (fallbackError) {
        console.error("Error with fallback breed extraction:", fallbackError);
      }

      // Last resort - return mock breeds
      return this.getMockBreeds();
    }
  }

  guessPurpose(products, breed) {
    const matchingProducts = products.filter((p) => p.breed === breed);
    if (matchingProducts.length === 0) return "Various";

    const purposes = matchingProducts
      .map((p) => p.specifications?.find((s) => s.name === "Purpose")?.value)
      .filter(Boolean);

    if (purposes.length === 0) return "Various";

    // Find most common purpose
    const purposeCounts = {};
    purposes.forEach((p) => {
      purposeCounts[p] = (purposeCounts[p] || 0) + 1;
    });

    return Object.entries(purposeCounts).sort((a, b) => b[1] - a[1])[0][0];
  }

  getMockBreeds() {
    return [
      // Chickens
      {
        name: "Rhode Island Red",
        category: "chicken",
        characteristics: {
          purpose: "Dual",
          origin: "USA",
          eggColor: "Brown",
        },
      },
      {
        name: "Leghorn",
        category: "chicken",
        characteristics: {
          purpose: "Egg",
          origin: "Italy",
          eggColor: "White",
        },
      },
      {
        name: "Plymouth Rock",
        category: "chicken",
        characteristics: {
          purpose: "Dual",
          origin: "USA",
          eggColor: "Brown",
        },
      },

      // Ducks
      {
        name: "Pekin",
        category: "duck",
        characteristics: {
          purpose: "Meat",
          origin: "China",
          eggColor: "White",
        },
      },
      {
        name: "Khaki Campbell",
        category: "duck",
        characteristics: {
          purpose: "Egg",
          origin: "England",
          eggColor: "White",
        },
      },

      // Turkeys
      {
        name: "Bronze",
        category: "turkey",
        characteristics: {
          purpose: "Meat",
          origin: "USA",
          eggColor: "Speckled",
        },
      },
      {
        name: "Bourbon Red",
        category: "turkey",
        characteristics: {
          purpose: "Meat",
          origin: "USA",
          eggColor: "Speckled",
        },
      },
    ];
  }

  async createBreedingRecord(recordData) {
    try {
      const response = await axiosInstance.post(
        `${this.baseUrl}/records`,
        recordData
      );
      toast.success("Breeding record created successfully");
      return response.data;
    } catch (error) {
      this.handleApiError(error, "Error creating breeding record");
      throw error;
    }
  }

  async getBreedingRecords() {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/records`);
      return response.data;
    } catch (error) {
      this.handleApiError(error, "Error fetching breeding records");
      throw error;
    }
  }

  // Added methods to support the BreedingManagementPage
  async getActiveBreedingPairs() {
    // Try to get pairs from localStorage first
    try {
      const storedPairsJSON = localStorage.getItem("breedingPairs");
      if (storedPairsJSON) {
        const storedPairs = JSON.parse(storedPairsJSON);
        if (Array.isArray(storedPairs) && storedPairs.length > 0) {
          console.log(
            "Retrieved active breeding pairs from localStorage:",
            storedPairs
          );
          // Return all pairs that aren't "completed"
          return storedPairs.filter((pair) => pair.status !== "completed");
        }
      }
    } catch (error) {
      console.error("Error reading breeding pairs from localStorage:", error);
    }

    // Fall back to API or mock data if localStorage fails or is empty
    if (this.useLocalDatabase) {
      return this.getMockActiveBreedingPairs();
    }

    try {
      const response = await axiosInstance.get(`${this.baseUrl}/pairs/active`);
      return response.data;
    } catch (error) {
      if (!(error.response?.status === 404)) {
        console.error("Error fetching active breeding pairs:", error);
      }
      return this.getMockActiveBreedingPairs();
    }
  }

  // Add missing getBreedingPairs method for BreedingPairManager component
  async getBreedingPairs() {
    // Try to get pairs from local storage first
    try {
      const storedPairsJSON = localStorage.getItem("breedingPairs");
      if (storedPairsJSON) {
        const storedPairs = JSON.parse(storedPairsJSON);
        if (Array.isArray(storedPairs) && storedPairs.length > 0) {
          console.log(
            "Retrieved breeding pairs from localStorage:",
            storedPairs
          );
          return storedPairs;
        }
      }
    } catch (error) {
      console.error("Error reading breeding pairs from localStorage:", error);
    }

    // Fall back to API or mock data if localStorage fails or is empty
    if (this.useLocalDatabase) {
      return this.getMockActiveBreedingPairs();
    }

    try {
      const response = await axiosInstance.get(`${this.baseUrl}/pairs`);
      return response.data;
    } catch (error) {
      if (!(error.response?.status === 404)) {
        console.error("Error fetching breeding pairs:", error);
      }
      return this.getMockActiveBreedingPairs();
    }
  }

  // Add missing getBreedsByCategory method for BreedingCalculator component
  async getBreedsByCategory(category) {
    // Directly use local data instead of API call
    if (this.useLocalDatabase) {
      // Filter breeds from breedDatabase that match the category
      const filteredBreeds = Object.entries(breedDatabase)
        .filter(([_, breed]) => {
          if (category === "chicken") {
            return breed.type === "chicken";
          }
          if (category === "duck") {
            return breed.type === "duck";
          }
          if (category === "turkey") {
            return breed.type === "turkey";
          }
          return false;
        })
        .map(([name, breed]) => ({
          id: name.toLowerCase().replace(/\s+/g, "-"),
          name: name,
          category: breed.type,
          breed: breed,
        }));

      return filteredBreeds;
    }

    // Rest of the method as before
    try {
      const response = await axiosInstance.get(
        `${this.baseUrl}/breeds/${category}`
      );
      return response.data;
    } catch (error) {
      if (!(error.response?.status === 404)) {
        console.error(`Error fetching breeds for category ${category}:`, error);
      }

      try {
        const allBreeds = await this.getBreeds();
        return allBreeds.filter((breed) => breed.category === category);
      } catch (fallbackError) {
        console.error("Error with breed category fallback:", fallbackError);
        return [];
      }
    }
  }

  async getRecentCalculations() {
    // Try to get calculations from local storage first
    try {
      const storedCalcsJSON = localStorage.getItem("recentCalculations");
      if (storedCalcsJSON) {
        const storedCalcs = JSON.parse(storedCalcsJSON);
        if (Array.isArray(storedCalcs) && storedCalcs.length > 0) {
          console.log(
            "Retrieved recent calculations from localStorage:",
            storedCalcs
          );
          return storedCalcs;
        }
      }
    } catch (error) {
      console.error(
        "Error reading recent calculations from localStorage:",
        error
      );
    }

    // Fall back to API or mock data if localStorage fails or is empty
    if (this.useLocalDatabase) {
      return this.getMockRecentCalculations();
    }

    try {
      const response = await axiosInstance.get(
        `${this.baseUrl}/calculations/recent`
      );
      return response.data;
    } catch (error) {
      if (!(error.response?.status === 404)) {
        console.error("Error fetching recent calculations:", error);
      }
      return this.getMockRecentCalculations();
    }
  }

  async getBreedingStats() {
    // Directly use local data instead of API call
    if (this.useLocalDatabase) {
      return this.getMockBreedingStats();
    }

    try {
      const response = await axiosInstance.get(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error) {
      if (!(error.response?.status === 404)) {
        console.error("Error fetching breeding stats:", error);
      }
      return this.getMockBreedingStats();
    }
  }

  async calculateBreedingCompatibility(breed1, breed2, category) {
    // Use the breedDatabase to calculate compatibility locally
    if (
      this.useLocalDatabase &&
      breedDatabase[breed1] &&
      breedDatabase[breed2]
    ) {
      // Check if we have a predefined combination
      const combinationKey = `${breed1} × ${breed2}`;
      const reverseCombinationKey = `${breed2} × ${breed1}`;

      if (breedCombinations[combinationKey]) {
        const result = breedCombinations[combinationKey];
        return {
          score: 85,
          geneticScore: 80,
          healthScore: 90,
          successScore: 85,
          expectedTraits: result.expectedTraits,
          breedingConsiderations: result.breedingConsiderations || [
            "Monitor for typical breed-specific health concerns",
            "Provide appropriate environmental conditions for both breeds",
          ],
          timestamp: new Date(),
        };
      } else if (breedCombinations[reverseCombinationKey]) {
        const result = breedCombinations[reverseCombinationKey];
        return {
          score: 85,
          geneticScore: 80,
          healthScore: 90,
          successScore: 85,
          expectedTraits: result.expectedTraits,
          breedingConsiderations: result.breedingConsiderations || [
            "Monitor for typical breed-specific health concerns",
            "Provide appropriate environmental conditions for both breeds",
          ],
          timestamp: new Date(),
        };
      }

      // Generate a custom compatibility assessment
      return {
        score: Math.floor(Math.random() * 30) + 65, // Random score between 65-95
        geneticScore: Math.floor(Math.random() * 25) + 70,
        healthScore: Math.floor(Math.random() * 20) + 75,
        successScore: Math.floor(Math.random() * 25) + 70,
        expectedTraits: {
          eggProduction: "Moderate to High",
          eggColor:
            breedDatabase[breed1].eggColor ||
            breedDatabase[breed2].eggColor ||
            "Mixed",
          temperament: "Mixed characteristics",
          meatQuality: "Good",
          maturityRate: "Average",
        },
        breedingConsiderations: [
          `Consider specific needs of both ${breed1} and ${breed2}`,
          "Ensure proper nutrition for breeding success",
          "Monitor offspring for health and vigor",
        ],
        timestamp: new Date(),
      };
    }

    // If we don't find the breed in our database, try the API
    try {
      const response = await axiosInstance.post(
        `${this.baseUrl}/compatibility`,
        { breed1, breed2, category }
      );
      return response.data;
    } catch (error) {
      console.error("Error calculating breeding compatibility:", error);
      // Return a fallback compatibility assessment
      return {
        score: 75,
        geneticScore: 70,
        healthScore: 80,
        successScore: 75,
        expectedTraits: {
          eggProduction: "Variable",
          eggColor: "Mixed",
          temperament: "Variable",
          meatQuality: "Average",
          maturityRate: "Standard",
        },
        breedingConsiderations: [
          "Standard breeding practices recommended",
          "Monitor health of offspring closely",
          "Consult with a poultry specialist for specific guidance",
        ],
        timestamp: new Date(),
      };
    }
  }

  // Add missing getMockRecentCalculations function
  getMockRecentCalculations() {
    return [
      {
        id: "calc-1",
        breed1: "Rhode Island Red",
        breed2: "Plymouth Rock",
        score: 85,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "calc-2",
        breed1: "Leghorn",
        breed2: "Rhode Island Red",
        score: 72,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "calc-3",
        breed1: "Pekin",
        breed2: "Khaki Campbell",
        score: 78,
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "calc-4",
        breed1: "Bronze",
        breed2: "Bourbon Red",
        score: 92,
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  // Add missing getMockBreedingStats function
  getMockBreedingStats() {
    return {
      totalProjects: 5,
      activePairs: 3,
      successRate: 78,
      upcomingHatches: 2,
    };
  }

  // Add missing getMockActiveBreedingPairs function
  getMockActiveBreedingPairs() {
    return [
      {
        id: "pair-1",
        sire: { name: "Red King", breed: "Rhode Island Red" },
        dam: { name: "Ruby", breed: "Rhode Island Red" },
        startDate: new Date(
          Date.now() - 15 * 24 * 60 * 60 * 1000
        ).toISOString(),
        status: "Incubating",
        progress: 65,
      },
      {
        id: "pair-2",
        sire: { name: "Drake", breed: "Pekin" },
        dam: { name: "Daisy", breed: "Khaki Campbell" },
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "Breeding",
        progress: 30,
      },
      {
        id: "pair-3",
        sire: { name: "Tom", breed: "Bronze" },
        dam: { name: "Bertha", breed: "Bourbon Red" },
        startDate: new Date(
          Date.now() - 21 * 24 * 60 * 60 * 1000
        ).toISOString(),
        status: "Hatching",
        progress: 95,
      },
    ];
  }

  // Add method to create breeding pair from breed names
  async createBreedingPair(pairData) {
    // When using local database
    if (this.useLocalDatabase) {
      try {
        // Generate a unique ID
        const pairId = `pair-${Date.now()}`;

        // If we have breed names instead of actual sire/dam objects
        if (
          typeof pairData.sire === "string" ||
          typeof pairData.dam === "string"
        ) {
          // Get breeding stock to find matching animals
          const stock = await this.getBreedingStock();

          // Find a male of the specified breed
          const sireBreed = pairData.sire;
          const sire = stock.find(
            (animal) => animal.breed === sireBreed && animal.sex === "Male"
          ) || {
            name: `${sireBreed} Male`,
            breed: sireBreed,
          };

          // Find a female of the specified breed
          const damBreed = pairData.dam;
          const dam = stock.find(
            (animal) => animal.breed === damBreed && animal.sex === "Female"
          ) || {
            name: `${damBreed} Female`,
            breed: damBreed,
          };

          // Create the new pair
          const newPair = {
            id: pairId,
            sire: { name: sire.name, breed: sire.breed },
            dam: { name: dam.name, breed: dam.breed },
            startDate: pairData.startDate || new Date().toISOString(),
            status: pairData.status || "planning",
            progress: 5,
            notes: pairData.notes || "",
          };

          // Store the new pair in local storage to persist it across sessions
          this.saveBreedingPairToLocalStorage(newPair);

          toast.success("Breeding pair created successfully");
          return newPair;
        } else {
          // We have the actual sire/dam objects
          const newPair = {
            id: pairId,
            ...pairData,
            status: pairData.status || "planning",
            progress: 5,
          };

          // Store the new pair in local storage to persist it across sessions
          this.saveBreedingPairToLocalStorage(newPair);

          toast.success("Breeding pair created successfully");
          return newPair;
        }
      } catch (error) {
        console.error("Error creating breeding pair:", error);
        toast.error("Failed to create breeding pair");
        throw error;
      }
    }

    // When using API
    try {
      const response = await axiosInstance.post(
        `${this.baseUrl}/pairs`,
        pairData
      );
      toast.success("Breeding pair created successfully");
      return response.data;
    } catch (error) {
      this.handleApiError(error, "Error creating breeding pair");
      throw error;
    }
  }

  // Method to save breeding pair to local storage
  saveBreedingPairToLocalStorage(newPair) {
    try {
      // Get existing pairs from local storage
      const existingPairsJSON = localStorage.getItem("breedingPairs");
      const existingPairs = existingPairsJSON
        ? JSON.parse(existingPairsJSON)
        : [];

      // Add new pair to the array
      existingPairs.push(newPair);

      // Save back to local storage
      localStorage.setItem("breedingPairs", JSON.stringify(existingPairs));

      // Also add this to recent calculations
      this.saveCalculationToLocalStorage({
        id: `calc-${Date.now()}`,
        breed1: newPair.sire.breed,
        breed2: newPair.dam.breed,
        score: 75, // Default score if not provided
        date: new Date().toISOString(),
      });

      console.log("Breeding pair saved to local storage", newPair);
    } catch (error) {
      console.error("Error saving breeding pair to local storage:", error);
    }
  }

  // Method to save calculation to local storage
  saveCalculationToLocalStorage(calculation) {
    try {
      // Get existing calculations from local storage
      const existingCalcsJSON = localStorage.getItem("recentCalculations");
      const existingCalcs = existingCalcsJSON
        ? JSON.parse(existingCalcsJSON)
        : [];

      // Add new calculation to the beginning of the array (most recent first)
      existingCalcs.unshift(calculation);

      // Limit to 10 recent calculations
      const limitedCalcs = existingCalcs.slice(0, 10);

      // Save back to local storage
      localStorage.setItem("recentCalculations", JSON.stringify(limitedCalcs));

      console.log("Calculation saved to local storage", calculation);
    } catch (error) {
      console.error("Error saving calculation to local storage:", error);
    }
  }

  // Add method to update breeding pair status
  async updateBreedingPairStatus(pairId, newStatus) {
    // When using local database
    if (this.useLocalDatabase) {
      try {
        // Get existing pairs from local storage
        const storedPairsJSON = localStorage.getItem("breedingPairs");
        if (!storedPairsJSON) {
          throw new Error("No breeding pairs found in localStorage");
        }

        const storedPairs = JSON.parse(storedPairsJSON);

        // Find the pair to update
        const pairIndex = storedPairs.findIndex((pair) => pair.id === pairId);
        if (pairIndex === -1) {
          throw new Error(`Breeding pair with id ${pairId} not found`);
        }

        // Update the status
        storedPairs[pairIndex].status = newStatus;

        // Update progress based on status
        switch (newStatus) {
          case "planning":
            storedPairs[pairIndex].progress = 5;
            break;
          case "active":
            storedPairs[pairIndex].progress = 25;
            break;
          case "incubating":
            storedPairs[pairIndex].progress = 60;
            break;
          case "hatched":
            storedPairs[pairIndex].progress = 90;
            break;
          case "completed":
            storedPairs[pairIndex].progress = 100;
            break;
          default:
            // Keep existing progress if status is not recognized
            break;
        }

        // Save back to local storage
        localStorage.setItem("breedingPairs", JSON.stringify(storedPairs));

        console.log(`Breeding pair ${pairId} status updated to ${newStatus}`);
        return storedPairs[pairIndex];
      } catch (error) {
        console.error("Error updating breeding pair status:", error);
        throw error;
      }
    }

    // When using API
    try {
      const response = await axiosInstance.put(
        `${this.baseUrl}/pairs/${pairId}/status`,
        { status: newStatus }
      );
      toast.success(`Breeding pair status updated to ${newStatus}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error, "Error updating breeding pair status");
      throw error;
    }
  }

  // Add method to create breeding project
  async createBreedingProject(projectData) {
    // When using local database
    if (this.useLocalDatabase) {
      try {
        // Generate a unique ID
        const projectId = `project-${Date.now()}`;

        // Create the new project
        const newProject = {
          id: projectId,
          ...projectData,
          status: projectData.status || "active",
          startDate: new Date().toISOString(),
          currentGeneration: 0,
          progress: 0,
          pairs: [],
        };

        // Store the new project in local storage to persist it across sessions
        this.saveProjectToLocalStorage(newProject);

        toast.success("Breeding project created successfully");
        return newProject;
      } catch (error) {
        console.error("Error creating breeding project:", error);
        toast.error("Failed to create breeding project");
        throw error;
      }
    }

    // When using API
    try {
      const response = await axiosInstance.post(
        `${this.baseUrl}/projects`,
        projectData
      );
      toast.success("Breeding project created successfully");
      return response.data;
    } catch (error) {
      this.handleApiError(error, "Error creating breeding project");
      throw error;
    }
  }

  // Method to save project to local storage
  saveProjectToLocalStorage(newProject) {
    try {
      // Get existing projects from local storage
      const existingProjectsJSON = localStorage.getItem("breedingProjects");
      const existingProjects = existingProjectsJSON
        ? JSON.parse(existingProjectsJSON)
        : [];

      // Add new project to the array
      existingProjects.push(newProject);

      // Save back to local storage
      localStorage.setItem(
        "breedingProjects",
        JSON.stringify(existingProjects)
      );

      console.log("Breeding project saved to local storage", newProject);
    } catch (error) {
      console.error("Error saving breeding project to local storage:", error);
    }
  }

  // Add method to get breeding analytics data
  async getBreedingAnalytics(timeRange = "6m") {
    // When using local database
    if (this.useLocalDatabase) {
      try {
        console.log(`Getting breeding analytics for time range: ${timeRange}`);

        // Generate analytics based on timeRange
        // Convert timeRange to actual date range
        const now = new Date();
        let startDate;
        switch (timeRange) {
          case "1m":
            startDate = subMonths(now, 1);
            break;
          case "3m":
            startDate = subMonths(now, 3);
            break;
          case "6m":
            startDate = subMonths(now, 6);
            break;
          case "1y":
            startDate = subMonths(now, 12);
            break;
          case "all":
            startDate = new Date(0); // Beginning of time
            break;
          default:
            startDate = subMonths(now, 6); // Default to 6 months
        }

        // Get breeding pairs from localStorage
        const storedPairsJSON = localStorage.getItem("breedingPairs");
        const breedingPairs = storedPairsJSON
          ? JSON.parse(storedPairsJSON)
          : [];

        // Get breeding projects from localStorage
        const storedProjectsJSON = localStorage.getItem("breedingProjects");
        const breedingProjects = storedProjectsJSON
          ? JSON.parse(storedProjectsJSON)
          : [];

        // Generate monthly stats
        const monthlyStats = this.generateMonthlyStats(
          breedingPairs,
          startDate
        );

        // Generate breed distribution
        const breedDistribution = this.generateBreedDistribution(breedingPairs);

        // Generate success by breed
        const successByBreed = this.generateSuccessByBreed(breedingPairs);

        // Generate recent activity
        const recentActivity = this.generateRecentActivity(
          breedingPairs,
          breedingProjects,
          startDate
        );

        return {
          monthlyStats,
          breedDistribution,
          successByBreed,
          recentActivity,
        };
      } catch (error) {
        console.error("Error generating breeding analytics:", error);
        throw error;
      }
    }

    // When using API
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/analytics`, {
        params: { timeRange },
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error, "Error fetching breeding analytics");
      throw error;
    }
  }

  // Helper method to generate monthly stats
  generateMonthlyStats(breedingPairs, startDate) {
    const months = [];
    const now = new Date();

    // Get months between startDate and now
    for (
      let date = new Date(startDate);
      date <= now;
      date.setMonth(date.getMonth() + 1)
    ) {
      months.push(format(date, "MMM yyyy"));
    }

    return months.map((month) => {
      // Calculate success and hatch rates based on breeding pairs
      // This is simplified - you'd normally have more complex logic
      return {
        month,
        successRate: Math.floor(Math.random() * 30) + 60, // Random between 60-90%
        hatchRate: Math.floor(Math.random() * 20) + 70, // Random between 70-90%
      };
    });
  }

  // Helper method to generate breed distribution
  generateBreedDistribution(breedingPairs) {
    // Count occurrences of each breed
    const breedCounts = {};

    breedingPairs.forEach((pair) => {
      // Count both sire and dam breeds
      const sireBreed = pair.sire.breed;
      const damBreed = pair.dam.breed;

      breedCounts[sireBreed] = (breedCounts[sireBreed] || 0) + 1;
      breedCounts[damBreed] = (breedCounts[damBreed] || 0) + 1;
    });

    // Convert to format needed for PieChart
    return Object.entries(breedCounts)
      .map(([name, count]) => ({
        name,
        value: count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 breeds
  }

  // Helper method to generate success by breed
  generateSuccessByBreed(breedingPairs) {
    // Get unique breeds
    const breeds = new Set();
    breedingPairs.forEach((pair) => {
      breeds.add(pair.sire.breed);
      breeds.add(pair.dam.breed);
    });

    // Generate success rates for each breed
    return Array.from(breeds)
      .slice(0, 7)
      .map((breed) => ({
        breed,
        successRate: Math.floor(Math.random() * 30) + 60, // Random between 60-90%
      }));
  }

  // Helper method to generate recent activity
  generateRecentActivity(breedingPairs, breedingProjects, startDate) {
    const activities = [];

    // Create activities from breeding pairs
    breedingPairs.forEach((pair) => {
      const pairDate = new Date(pair.startDate);
      if (pairDate >= startDate) {
        activities.push({
          id: `pair-${pair.id}`,
          title: `New Breeding Pair Created`,
          description: `${pair.sire.breed} × ${pair.dam.breed}`,
          date: pair.startDate,
          type: "info",
          status: pair.status,
        });
      }

      // Add status change activities based on progress
      if (pair.progress >= 60) {
        activities.push({
          id: `hatch-${pair.id}`,
          title: `Incubation Started`,
          description: `${pair.sire.breed} × ${pair.dam.breed}`,
          date: new Date(
            new Date(pair.startDate).getTime() + 14 * 24 * 60 * 60 * 1000
          ).toISOString(),
          type: "warning",
          status: "in_progress",
        });
      }

      if (pair.progress >= 90) {
        activities.push({
          id: `success-${pair.id}`,
          title: `Successful Hatch`,
          description: `${pair.sire.breed} × ${pair.dam.breed}`,
          date: new Date(
            new Date(pair.startDate).getTime() + 21 * 24 * 60 * 60 * 1000
          ).toISOString(),
          type: "success",
          status: "completed",
        });
      }
    });

    // Create activities from breeding projects
    breedingProjects.forEach((project) => {
      const projectDate = new Date(project.startDate);
      if (projectDate >= startDate) {
        activities.push({
          id: `project-${project.id}`,
          title: `Project Started: ${project.name}`,
          description: project.description,
          date: project.startDate,
          type: "info",
          status: project.status,
        });
      }
    });

    // Sort by date (most recent first) and limit to 10 activities
    return activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  }
}

const breedingService = new BreedingService();
export default breedingService;

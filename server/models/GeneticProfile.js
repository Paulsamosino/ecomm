import mongoose from "mongoose";

const geneticProfileSchema = new mongoose.Schema(
  {
    // Link to product
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
    },

    // Basic genetic information
    breed: {
      primary: {
        name: String,
        percentage: { type: Number, min: 0, max: 100 },
      },
      secondary: {
        name: String,
        percentage: { type: Number, min: 0, max: 100 },
      },
      other: [
        {
          name: String,
          percentage: { type: Number, min: 0, max: 100 },
        },
      ],
    },

    // Genetic markers
    markers: [
      {
        name: String,
        value: String,
        significance: {
          type: String,
          enum: ["High", "Medium", "Low"],
        },
      },
    ],

    // Health testing
    healthTests: [
      {
        test: String,
        date: Date,
        result: String,
        laboratory: String,
        certificateUrl: String,
      },
    ],

    // Inherited traits
    inheritedTraits: [
      {
        trait: String,
        expression: {
          type: String,
          enum: ["Dominant", "Recessive", "Co-dominant", "Unknown"],
        },
        source: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      },
    ],

    // Color genetics
    colorGenetics: {
      baseColor: String,
      modifiers: [String],
      patterns: [String],
      predictedOffspringColors: [String],
    },

    // Physical characteristics influenced by genetics
    physicalTraits: {
      size: {
        type: String,
        enum: ["Mini", "Small", "Medium", "Large", "Giant"],
      },
      build: String,
      distinctiveFeatures: [String],
    },

    // Temperament genetics
    temperamentFactors: [
      {
        trait: String,
        heritability: { type: Number, min: 0, max: 100 },
        expression: String,
      },
    ],

    // Breeding compatibility
    breedingCompatibility: {
      recommendedPartners: [
        {
          breed: String,
          compatibilityScore: { type: Number, min: 0, max: 100 },
          notes: String,
        },
      ],
      restrictions: [String],
      optimalBreedingAge: {
        min: Number,
        max: Number,
      },
    },

    // Performance metrics
    performanceMetrics: {
      fertility: { type: Number, min: 0, max: 100 },
      maternalAptitude: { type: Number, min: 0, max: 100 },
      longevity: { type: Number, min: 0, max: 100 },
      adaptability: { type: Number, min: 0, max: 100 },
    },

    // Lineage verification
    lineageVerification: {
      isVerified: { type: Boolean, default: false },
      verificationMethod: String,
      verificationDate: Date,
      verifier: String,
    },

    // Genetic health risks
    healthRisks: [
      {
        condition: String,
        risk: {
          type: String,
          enum: ["High", "Medium", "Low", "None"],
        },
        preventiveMeasures: [String],
      },
    ],

    // Metadata
    lastUpdated: { type: Date, default: Date.now },
    certifications: [
      {
        type: String,
        issuer: String,
        date: Date,
        expiryDate: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
geneticProfileSchema.index({ product: 1 });
geneticProfileSchema.index({ "breed.primary.name": 1 });
geneticProfileSchema.index({ "healthTests.date": 1 });

// Virtual for calculating inbreeding coefficient
geneticProfileSchema.virtual("inbreedingCoefficient").get(function () {
  // This would need to be calculated based on pedigree data
  // Placeholder for now
  return 0;
});

// Methods
geneticProfileSchema.methods.calculateBreedingCompatibility = async function (
  partnerId
) {
  const partner = await this.model("GeneticProfile").findOne({
    product: partnerId,
  });
  if (!partner) return null;

  // Calculate compatibility score based on genetic markers, health risks, etc.
  let score = 100;

  // Reduce score for shared health risks
  const sharedRisks = this.healthRisks.filter((risk1) =>
    partner.healthRisks.some((risk2) => risk2.condition === risk1.condition)
  );
  score -= sharedRisks.length * 10;

  // Adjust for breed compatibility
  if (this.breed.primary.name === partner.breed.primary.name) {
    score -= 20; // Penalize same-breed breeding to promote genetic diversity
  }

  return Math.max(0, Math.min(100, score));
};

geneticProfileSchema.methods.updateHealthTest = async function (testData) {
  this.healthTests.push({
    ...testData,
    date: new Date(),
  });
  this.lastUpdated = new Date();
  await this.save();
};

const GeneticProfile = mongoose.model("GeneticProfile", geneticProfileSchema);

export default GeneticProfile;

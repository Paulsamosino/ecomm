import React, { useState } from 'react';

// Simplified genetic traits for easier calculations
const geneticTraits = {
  combType: { dominant: 'single', recessive: 'rose' },
  eggShellColor: { brown: 'O', white: 'o', blue: 'B' },
  featherPattern: { barred: 'B', solid: 'b' },
  bodySize: { large: 3, standard: 2, bantam: 1 }
};
// Simplified chicken breeds with essential genetic data
const chickenBreeds = [
  {
    name: "Rhode Island Red",
    purpose: "dual",
    size: "standard",
    eggColor: "brown",
    eggProduction: 250,
    weight: { hen: 6.5, rooster: 8.5 },
    genetics: { 
      comb: ['S', 'S'],
      eggShell: ['O', 'O'],
      featherPattern: ['b', 'b'],
      bodySize: [2, 3]
    },
    icon: "🐔"
  },
  {
    name: "White Leghorn",
    purpose: "egg",
    size: "standard", 
    eggColor: "white",
    eggProduction: 320,
    weight: { hen: 4.5, rooster: 6.0 },
    genetics: {
      comb: ['S', 'S'],
      eggShell: ['o', 'o'],
      featherPattern: ['b', 'b'],
      bodySize: [2, 2]
    },
    icon: "🐓"
  },
  {
    name: "Buff Orpington",
    purpose: "dual",
    size: "large",
    eggColor: "brown",
    eggProduction: 200,
    weight: { hen: 8.0, rooster: 10.0 },
    genetics: {
      comb: ['S', 'S'],
      eggShell: ['O', 'O'],
      featherPattern: ['b', 'b'],
      bodySize: [3, 3]
    },
    icon: "🐔"
  },
  {
    name: "Australorp",
    purpose: "dual",
    size: "standard",
    eggColor: "brown",
    eggProduction: 280,
    weight: { hen: 6.5, rooster: 8.5 },
    genetics: {
      comb: ['S', 'S'],
      eggShell: ['O', 'O'],
      featherPattern: ['b', 'b'],
      bodySize: [2, 3]
    },
    icon: "🐓"
  },
  {
    name: "Wyandotte",
    purpose: "dual",
    size: "standard",
    eggColor: "brown",
    eggProduction: 220,
    weight: { hen: 6.5, rooster: 8.5 },
    genetics: {
      comb: ['s', 's'],
      eggShell: ['O', 'O'],
      featherPattern: ['B', 'b'],
      bodySize: [2, 2]
    },
    icon: "🐔"
  },
  {
    name: "Ameraucana",
    purpose: "egg",
    size: "standard",
    eggColor: "blue",
    eggProduction: 200,
    weight: { hen: 5.5, rooster: 6.5 },
    genetics: {
      comb: ['s', 's'],
      eggShell: ['B', 'o'],
      featherPattern: ['b', 'b'],
      bodySize: [2, 2]
    },
    icon: "🐓"
  },
  {
    name: "Plymouth Rock",
    purpose: "dual",
    size: "standard",
    eggColor: "brown",
    eggProduction: 200,
    weight: { hen: 7.5, rooster: 9.5 },
    genetics: {
      comb: ['S', 'S'],
      eggShell: ['O', 'O'],
      featherPattern: ['B', 'B'],
      bodySize: [2, 3]
    },
    icon: "🐔"
  },
  {
    name: "Silkie",
    purpose: "ornamental",
    size: "bantam",
    eggColor: "cream",
    eggProduction: 120,
    weight: { hen: 2.0, rooster: 2.5 },
    genetics: {
      comb: ['s', 's'],
      eggShell: ['o', 'o'],
      featherPattern: ['b', 'b'],
      bodySize: [1, 1]
    },
    icon: "🐓"
  }
];

const BreedingSimulatorPage = () => {
  const [selectedHen, setSelectedHen] = useState(null);
  const [selectedRooster, setSelectedRooster] = useState(null);
  const [currentOffspring, setCurrentOffspring] = useState(null);
  const [isBreeding, setIsBreeding] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Simplified purpose text
  const getPurposeText = (purpose) => {
    const purposes = {
      'egg': 'Egg Layer',
      'meat': 'Meat',
      'dual': 'Dual Purpose',
      'ornamental': 'Ornamental'
    };
    return purposes[purpose] || purpose;
  };

  // Simplified genetic calculations
  const performGeneticCross = (parent1Genes, parent2Genes) => {
    const allele1 = parent1Genes[Math.floor(Math.random() * 2)];
    const allele2 = parent2Genes[Math.floor(Math.random() * 2)];
    return [allele1, allele2];
  };

  const calculateTraits = (hen, rooster) => {
    // Comb type calculation
    const combGenes = performGeneticCross(hen.genetics.comb, rooster.genetics.comb);
    const combType = combGenes.includes('S') ? 'single' : 'rose';

    // Egg color calculation
    const eggGenes = performGeneticCross(hen.genetics.eggShell, rooster.genetics.eggShell);
    let eggColor = 'white';
    if (eggGenes.includes('B')) {
      eggColor = eggGenes.includes('O') ? 'olive' : 'blue';
    } else if (eggGenes.includes('O')) {
      eggColor = eggGenes.filter(g => g === 'O').length === 2 ? 'dark brown' : 'brown';
    }

    // Feather pattern
    const featherGenes = performGeneticCross(hen.genetics.featherPattern, rooster.genetics.featherPattern);
    const featherPattern = featherGenes.includes('B') ? 'barred' : 'solid';

    // Size calculation
    const sizeGenes = performGeneticCross(hen.genetics.bodySize, rooster.genetics.bodySize);
    const avgSize = (sizeGenes[0] + sizeGenes[1]) / 2;
    const size = avgSize >= 2.5 ? 'large' : avgSize >= 1.5 ? 'standard' : 'bantam';

    // Weight calculation
    const henWeight = (hen.weight.hen + rooster.weight.hen) / 2;
    const roosterWeight = (hen.weight.rooster + rooster.weight.rooster) / 2;
    const sizeMultiplier = { 'bantam': 0.6, 'standard': 1.0, 'large': 1.3 }[size];
    
    // Egg production (with some hybrid vigor)
    const baseProduction = (hen.eggProduction + rooster.eggProduction) / 2;
    const hybridVigor = hen.name !== rooster.name ? 20 : -10;
    const eggProduction = Math.max(80, Math.round(baseProduction + hybridVigor + (Math.random() - 0.5) * 30));

    // Purpose determination
    let purpose = 'ornamental';
    if (eggProduction >= 250) purpose = 'egg';
    else if (henWeight * sizeMultiplier >= 7) purpose = 'meat';
    else if (eggProduction >= 180 && henWeight * sizeMultiplier >= 5.5) purpose = 'dual';

    return {
      name: `${hen.name.split(' ')[0]}-${rooster.name.split(' ')[0]} Cross`,
      purpose,
      size,
      eggColor,
      eggProduction,
      weight: {
        hen: Math.round((henWeight * sizeMultiplier) * 10) / 10,
        rooster: Math.round((roosterWeight * sizeMultiplier) * 10) / 10
      },
      genetics: {
        combType,
        featherPattern,
        parents: [hen.name, rooster.name]
      },
      icon: Math.random() > 0.5 ? "🐔" : "🐓"
    };
  };

  // Select a breed for breeding
  const selectBreed = (breed) => {
    if (!selectedHen) {
      setSelectedHen(breed);
    } else if (!selectedRooster) {
      setSelectedRooster(breed);
    } else {
      setSelectedHen(breed);
      setSelectedRooster(null);
      setCurrentOffspring(null);
      setShowAnalysis(false);
    }
  };

  // Breed chickens
  const breedChickens = async () => {
    if (!selectedHen || !selectedRooster) return;
    
    setIsBreeding(true);
    setCurrentOffspring(null);
    setShowAnalysis(false);
    
    setTimeout(() => {
      const offspring = calculateTraits(selectedHen, selectedRooster);
      setCurrentOffspring(offspring);
      setShowAnalysis(true);
      setIsBreeding(false);
    }, 1500);
  };

  // Clear all selections
  const clearAll = () => {
    setSelectedHen(null);
    setSelectedRooster(null);
    setCurrentOffspring(null);
    setShowAnalysis(false);
  };

  // Random breeding pair
  const selectRandomPair = () => {
    clearAll();
    const randomHen = chickenBreeds[Math.floor(Math.random() * chickenBreeds.length)];
    let randomRooster = chickenBreeds[Math.floor(Math.random() * chickenBreeds.length)];
    while (randomRooster.name === randomHen.name) {
      randomRooster = chickenBreeds[Math.floor(Math.random() * chickenBreeds.length)];
    }
    setSelectedHen(randomHen);
    setSelectedRooster(randomRooster);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5e9] to-[#fffaf2]">
      {/* Compact Hero Section */}
      <section className="bg-gradient-to-r from-[#fff0dd] to-[#fff5e9] py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/80 text-[#cd8539] text-sm font-medium mb-4">
            <span className="text-xl mr-2">🧬</span>
            Genetics Lab
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Chicken Breeding <span className="text-[#fcba6d]">Simulator</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Experience Mendelian genetics in action. Cross different breeds and see realistic inheritance patterns.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breeding Laboratory */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Breeding Laboratory</h2>
          
          {/* Breeding Grid - Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-center mb-6">
            {/* Hen Slot */}
            <div className={`bg-gradient-to-br from-pink-50 to-pink-100 border-2 rounded-lg p-4 text-center transition-all ${
              selectedHen ? 'border-pink-400 shadow-md' : 'border-gray-200 hover:border-pink-300'
            }`}>
              <div className="w-16 h-16 bg-white rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">
                {selectedHen ? selectedHen.icon : '🐔'}
              </div>
              <div className="font-bold text-sm mb-1">
                {selectedHen ? selectedHen.name : 'Select Hen'}
              </div>
              <div className="text-xs text-pink-600 mb-2">♀ Female</div>
              {selectedHen && (
                <div className="bg-white/80 rounded p-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium">{getPurposeText(selectedHen.purpose)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Eggs:</span>
                    <span className="font-medium">{selectedHen.eggProduction}/yr</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Color:</span>
                    <span className="font-medium">{selectedHen.eggColor}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Cross Symbol - Hidden on mobile */}
            <div className="hidden lg:flex justify-center">
              <div className="w-8 h-8 bg-[#fff0dd] rounded-full flex items-center justify-center text-[#cd8539] font-bold">×</div>
            </div>

            {/* Rooster Slot */}
            <div className={`bg-gradient-to-br from-blue-50 to-blue-100 border-2 rounded-lg p-4 text-center transition-all ${
              selectedRooster ? 'border-blue-400 shadow-md' : 'border-gray-200 hover:border-blue-300'
            }`}>
              <div className="w-16 h-16 bg-white rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">
                {selectedRooster ? selectedRooster.icon : '🐓'}
              </div>
              <div className="font-bold text-sm mb-1">
                {selectedRooster ? selectedRooster.name : 'Select Rooster'}
              </div>
              <div className="text-xs text-blue-600 mb-2">♂ Male</div>
              {selectedRooster && (
                <div className="bg-white/80 rounded p-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium">{getPurposeText(selectedRooster.purpose)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Eggs:</span>
                    <span className="font-medium">{selectedRooster.eggProduction}/yr</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Color:</span>
                    <span className="font-medium">{selectedRooster.eggColor}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Equals Symbol - Hidden on mobile */}
            <div className="hidden lg:flex justify-center">
              <div className="w-8 h-8 bg-[#e8f4ea] rounded-full flex items-center justify-center text-[#5c9d6f] font-bold">=</div>
            </div>

            {/* Offspring Slot */}
            <div className="bg-gradient-to-br from-[#fff8ef] to-[#fff0dd] border-2 border-[#ffecd4] rounded-lg p-4 text-center">
              {isBreeding ? (
                <>
                  <div className="w-16 h-16 bg-[#ffecd4] rounded-full mx-auto mb-3 flex items-center justify-center text-2xl animate-pulse">🥚</div>
                  <div className="font-bold text-sm text-gray-800">Incubating...</div>
                  <div className="text-xs text-[#cd8539]">Calculating genetics</div>
                </>
              ) : currentOffspring ? (
                <>
                  <div className="w-16 h-16 bg-[#ffecd4] rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">
                    {currentOffspring.icon}
                  </div>
                  <div className="font-bold text-sm mb-1">{currentOffspring.name}</div>
                  <div className="text-xs text-[#cd8539] mb-2">🐣 Offspring</div>
                  <div className="bg-white/80 rounded p-2 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium">{getPurposeText(currentOffspring.purpose)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Eggs:</span>
                      <span className="font-medium">{currentOffspring.eggProduction}/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Color:</span>
                      <span className="font-medium">{currentOffspring.eggColor}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">🥚</div>
                  <div className="font-bold text-sm text-gray-600">Offspring</div>
                  <div className="text-xs text-gray-500">Select parents to breed</div>
                </>
              )}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={breedChickens}
              disabled={!selectedHen || !selectedRooster || isBreeding}
              className="px-6 py-2 bg-[#fcba6d] text-white rounded-lg font-medium hover:bg-[#eead5f] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isBreeding ? 'Breeding...' : '🐣 Start Breeding'}
            </button>
            <button
              onClick={selectRandomPair}
              className="px-4 py-2 bg-[#4a7aaf] text-white rounded-lg font-medium hover:bg-[#3a6894] transition-colors"
            >
              🎲 Random Pair
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Genetics Analysis */}
        {showAnalysis && currentOffspring && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-xl mr-2">🧬</span>
              Genetic Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="bg-[#eef4fb] rounded-lg p-4">
                <div className="font-medium text-[#4a7aaf] mb-1">Comb Type</div>
                <div className="text-[#3a6894]">{currentOffspring.genetics.combType}</div>
              </div>
              <div className="bg-[#e8f4ea] rounded-lg p-4">
                <div className="font-medium text-[#5c9d6f] mb-1">Feather Pattern</div>
                <div className="text-[#4a8a5c]">{currentOffspring.genetics.featherPattern}</div>
              </div>
              <div className="bg-[#f3e8f8] rounded-lg p-4">
                <div className="font-medium text-[#8a5a9d] mb-1">Body Size</div>
                <div className="text-[#7a4a8d]">{currentOffspring.size}</div>
              </div>
              <div className="bg-[#fff0dd] rounded-lg p-4">
                <div className="font-medium text-[#cd8539] mb-1">Parents</div>
                <div className="text-[#b8753a] text-xs">
                  {currentOffspring.genetics.parents.map(p => p.split(' ')[0]).join(' × ')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Breed Selection Grid */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Available Breeds</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {chickenBreeds.map((breed, index) => (
              <div
                key={index}
                onClick={() => selectBreed(breed)}
                className="group bg-gray-50 hover:bg-[#fff5e9] border border-gray-200 hover:border-[#ffecd4] rounded-lg p-3 cursor-pointer transition-all transform hover:scale-105"
              >
                <div className="w-12 h-12 bg-white rounded-full mx-auto mb-2 flex items-center justify-center text-xl border-2 border-gray-200 group-hover:border-[#ffecd4]">
                  {breed.icon}
                </div>
                <div className="text-center">
                  <div className="font-medium text-xs text-gray-900 mb-1 leading-tight">
                    {breed.name}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {getPurposeText(breed.purpose)}
                  </div>
                  <div className="text-xs text-[#cd8539] font-medium">
                    {breed.eggProduction}/yr
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreedingSimulatorPage;

import React, { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Book,
  Dna,
  Egg,
  Feather,
  Heart,
  Scale,
  Thermometer,
  Info,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const BreedingTraitGuide = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("genetic");

  // Trait data
  const traits = {
    genetic: [
      {
        id: "dominant-recessive",
        title: "Dominant vs. Recessive Traits",
        description:
          "Understanding how dominant and recessive genes affect offspring appearance and traits.",
        content: (
          <>
            <p className="mb-4">
              In poultry breeding, traits are passed from parents to offspring through genes that can be either dominant or recessive:
            </p>
            <ul className="space-y-2 mb-4">
              <li>
                <span className="font-medium">Dominant traits</span> are expressed whenever the gene is present, even if only inherited from one parent.
              </li>
              <li>
                <span className="font-medium">Recessive traits</span> are only expressed when two copies of the gene are present (one from each parent).
              </li>
            </ul>
            <p className="mb-4">
              For example, in many chicken breeds, black feather color is dominant over white. A chicken with even one copy of the black gene will display black feathers.
            </p>
            <div className="bg-muted p-3 rounded-md mb-4">
              <h4 className="font-medium mb-2">Example: Feather Color Inheritance</h4>
              <p className="text-sm">
                If B = black (dominant) and b = white (recessive):
              </p>
              <ul className="text-sm mt-2">
                <li>BB = Black feathers</li>
                <li>Bb = Black feathers (carries white gene)</li>
                <li>bb = White feathers</li>
              </ul>
            </div>
          </>
        ),
      },
      {
        id: "heterosis",
        title: "Hybrid Vigor (Heterosis)",
        description:
          "The increased strength, growth rate, and fertility that can result from crossbreeding.",
        content: (
          <>
            <p className="mb-4">
              Hybrid vigor, or heterosis, is the improved biological quality in a hybrid offspring. When two different breeds are crossed, the offspring often show:
            </p>
            <ul className="space-y-2 mb-4">
              <li>Increased growth rate and size</li>
              <li>Better disease resistance</li>
              <li>Improved fertility</li>
              <li>Enhanced overall performance</li>
            </ul>
            <p className="mb-4">
              This phenomenon occurs because crossbreeding helps mask harmful recessive genes that might be present in purebred lines.
            </p>
            <div className="bg-muted p-3 rounded-md mb-4">
              <h4 className="font-medium mb-2">Example: Commercial Applications</h4>
              <p className="text-sm">
                Many commercial egg layers are hybrid crosses specifically designed to maximize egg production while maintaining good feed conversion efficiency.
              </p>
            </div>
          </>
        ),
      },
      {
        id: "heritability",
        title: "Heritability",
        description:
          "The degree to which a trait is passed from parent to offspring.",
        content: (
          <>
            <p className="mb-4">
              Heritability measures how much of the variation in a trait is due to genetic factors versus environmental influences:
            </p>
            <ul className="space-y-2 mb-4">
              <li>
                <span className="font-medium">High heritability traits</span> (0.5-1.0) are strongly influenced by genetics and respond well to selective breeding. Examples include feather color and comb type.
              </li>
              <li>
                <span className="font-medium">Medium heritability traits</span> (0.2-0.5) are influenced by both genetics and environment. Examples include body weight and egg size.
              </li>
              <li>
                <span className="font-medium">Low heritability traits</span> (0-0.2) are more influenced by environment than genetics. Examples include fertility and hatchability.
              </li>
            </ul>
            <p className="mb-4">
              Understanding heritability helps breeders decide which traits can be effectively improved through selective breeding versus management improvements.
            </p>
          </>
        ),
      },
      {
        id: "genetic-defects",
        title: "Genetic Defects & Lethal Genes",
        description:
          "Harmful genetic traits that can affect offspring health and viability.",
        content: (
          <>
            <p className="mb-4">
              Some genetic traits can be harmful or even fatal to offspring. Responsible breeding requires awareness of these potential issues:
            </p>
            <ul className="space-y-2 mb-4">
              <li>
                <span className="font-medium">Lethal genes</span> cause death, usually during embryonic development.
              </li>
              <li>
                <span className="font-medium">Semi-lethal genes</span> severely reduce viability but don't always cause death.
              </li>
              <li>
                <span className="font-medium">Genetic defects</span> may affect quality of life without being fatal.
              </li>
            </ul>
            <div className="bg-muted p-3 rounded-md mb-4">
              <h4 className="font-medium mb-2">Common Genetic Issues</h4>
              <ul className="text-sm">
                <li><span className="font-medium">Creeper gene</span> - Shortens legs but is lethal when homozygous</li>
                <li><span className="font-medium">Frizzle gene</span> - Causes feathers to curl outward, can lead to temperature regulation issues</li>
                <li><span className="font-medium">Crooked toes</span> - Hereditary condition affecting mobility</li>
              </ul>
            </div>
            <p>
              Careful selection of breeding stock and understanding of genetic inheritance patterns can help minimize these issues.
            </p>
          </>
        ),
      },
    ],
    production: [
      {
        id: "egg-production",
        title: "Egg Production Traits",
        description:
          "Factors affecting egg quantity, size, color, and quality.",
        content: (
          <>
            <p className="mb-4">
              Egg production traits are economically important and influenced by both genetics and environment:
            </p>
            <ul className="space-y-2 mb-4">
              <li>
                <span className="font-medium">Egg quantity</span> - Number of eggs laid per year (ranges from 150-300+ depending on breed)
              </li>
              <li>
                <span className="font-medium">Egg size</span> - Typically measured in grams or categorized (small, medium, large, etc.)
              </li>
              <li>
                <span className="font-medium">Shell color</span> - Determined by genetics (white, brown, blue, green)
              </li>
              <li>
                <span className="font-medium">Shell quality</span> - Thickness, strength, and texture
              </li>
              <li>
                <span className="font-medium">Interior quality</span> - Albumen height, yolk color, and absence of blood/meat spots
              </li>
            </ul>
            <div className="bg-muted p-3 rounded-md mb-4">
              <h4 className="font-medium mb-2">Top Egg Production Breeds</h4>
              <ul className="text-sm">
                <li><span className="font-medium">Leghorn</span> - 250-300+ white eggs annually</li>
                <li><span className="font-medium">Rhode Island Red</span> - 250-300 brown eggs annually</li>
                <li><span className="font-medium">Australorp</span> - 250+ brown eggs annually</li>
                <li><span className="font-medium">Ameraucana</span> - 180-200 blue eggs annually</li>
              </ul>
            </div>
          </>
        ),
      },
      {
        id: "meat-production",
        title: "Meat Production Traits",
        description:
          "Characteristics related to growth rate, feed efficiency, and meat quality.",
        content: (
          <>
            <p className="mb-4">
              Meat production traits determine the efficiency and quality of birds raised for meat:
            </p>
            <ul className="space-y-2 mb-4">
              <li>
                <span className="font-medium">Growth rate</span> - Speed of weight gain
              </li>
              <li>
                <span className="font-medium">Feed conversion ratio</span> - Amount of feed required to produce a unit of weight gain
              </li>
              <li>
                <span className="font-medium">Breast meat yield</span> - Proportion of breast meat to total body weight
              </li>
              <li>
                <span className="font-medium">Meat quality</span> - Texture, flavor, and fat content
              </li>
              <li>
                <span className="font-medium">Carcass yield</span> - Percentage of usable meat after processing
              </li>
            </ul>
            <div className="bg-muted p-3 rounded-md mb-4">
              <h4 className="font-medium mb-2">Top Meat Production Breeds</h4>
              <ul className="text-sm">
                <li><span className="font-medium">Cornish Cross</span> - Rapid growth, ready for market in 6-8 weeks</li>
                <li><span className="font-medium">Jersey Giant</span> - Large size but slower growth (16-20 weeks)</li>
                <li><span className="font-medium">Bresse</span> - Known for exceptional meat quality</li>
                <li><span className="font-medium">Freedom Ranger</span> - Good growth rate for pasture-raised systems</li>
              </ul>
            </div>
          </>
        ),
      },
      {
        id: "dual-purpose",
        title: "Dual-Purpose Traits",
        description:
          "Balanced characteristics for both egg and meat production.",
        content: (
          <>
            <p className="mb-4">
              Dual-purpose breeds offer a compromise between specialized egg and meat production:
            </p>
            <ul className="space-y-2 mb-4">
              <li>
                <span className="font-medium">Moderate egg production</span> - Usually 180-250 eggs annually
              </li>
              <li>
                <span className="font-medium">Good body size</span> - Sufficient for meat production but not as large as dedicated meat breeds
              </li>
              <li>
                <span className="font-medium">Feed efficiency</span> - Balanced for both growth and egg laying
              </li>
              <li>
                <span className="font-medium">Hardiness</span> - Often more adaptable to varied conditions than highly specialized breeds
              </li>
            </ul>
            <div className="bg-muted p-3 rounded-md mb-4">
              <h4 className="font-medium mb-2">Popular Dual-Purpose Breeds</h4>
              <ul className="text-sm">
                <li><span className="font-medium">Orpington</span> - Good egg production with substantial body size</li>
                <li><span className="font-medium">Plymouth Rock</span> - Consistent egg layer with good meat quality</li>
                <li><span className="font-medium">Wyandotte</span> - Decent egg production and meaty carcass</li>
                <li><span className="font-medium">Sussex</span> - Reliable egg layer that grows to good size</li>
              </ul>
            </div>
          </>
        ),
      },
    ],
    compatibility: [
      {
        id: "breed-compatibility",
        title: "Breed Compatibility Factors",
        description:
          "Key considerations when matching breeds for successful breeding.",
        content: (
          <>
            <p className="mb-4">
              When selecting breeds to cross, several factors affect compatibility and success:
            </p>
            <ul className="space-y-2 mb-4">
              <li>
                <span className="font-medium">Size difference</span> - Significant size disparities between breeds can cause mating difficulties or egg fertility issues
              </li>
              <li>
                <span className="font-medium">Genetic distance</span> - Closely related breeds may not exhibit as much hybrid vigor
              </li>
              <li>
                <span className="font-medium">Temperament</span> - Aggressive breeds paired with docile ones may result in mating stress
              </li>
              <li>
                <span className="font-medium">Breeding season alignment</span> - Some breeds have stronger seasonal breeding patterns than others
              </li>
            </ul>
            <div className="bg-muted p-3 rounded-md mb-4">
              <h4 className="font-medium mb-2">Compatibility Guidelines</h4>
              <ul className="text-sm">
                <li>Match breeds of similar size when possible</li>
                <li>Consider using artificial insemination for breeds with significant size differences</li>
                <li>Research breed-specific mating behaviors before pairing</li>
                <li>Monitor new breeding pairs closely for compatibility issues</li>
              </ul>
            </div>
          </>
        ),
      },
      {
        id: "climate-adaptation",
        title: "Climate Adaptation",
        description:
          "How different breeds adapt to various climate conditions.",
        content: (
          <>
            <p className="mb-4">
              Climate adaptation traits are crucial for breeding success in specific environments:
            </p>
            <ul className="space-y-2 mb-4">
              <li>
                <span className="font-medium">Cold tolerance</span> - Determined by factors like comb size, feather density, and body mass
              </li>
              <li>
                <span className="font-medium">Heat tolerance</span> - Influenced by body size, feather type, and comb size
              </li>
              <li>
                <span className="font-medium">Humidity adaptation</span> - Affects respiratory health and egg quality
              </li>
              <li>
                <span className="font-medium">Foraging ability</span> - Important for free-range systems in various climates
              </li>
            </ul>
            <div className="bg-muted p-3 rounded-md mb-4">
              <h4 className="font-medium mb-2">Climate-Adapted Breeds</h4>
              <ul className="text-sm">
                <li><span className="font-medium">Cold-hardy</span>: Brahma, Wyandotte, Orpington, Chantecler</li>
                <li><span className="font-medium">Heat-tolerant</span>: Leghorn, Minorca, Andalusian, Fayoumi</li>
                <li><span className="font-medium">Adaptable</span>: Rhode Island Red, Plymouth Rock, Sussex</li>
              </ul>
            </div>
          </>
        ),
      },
      {
        id: "disease-resistance",
        title: "Disease Resistance",
        description:
          "Genetic factors affecting immunity and disease susceptibility.",
        content: (
          <>
            <p className="mb-4">
              Disease resistance varies significantly between breeds and can be improved through selective breeding:
            </p>
            <ul className="space-y-2 mb-4">
              <li>
                <span className="font-medium">Natural immunity</span> - Some breeds have evolved stronger resistance to specific pathogens
              </li>
              <li>
                <span className="font-medium">Genetic disease resistance</span> - Certain genes provide protection against specific diseases
              </li>
              <li>
                <span className="font-medium">Stress resistance</span> - Ability to maintain health under environmental stress
              </li>
              <li>
                <span className="font-medium">Parasite resistance</span> - Ability to withstand internal and external parasites
              </li>
            </ul>
            <div className="bg-muted p-3 rounded-md mb-4">
              <h4 className="font-medium mb-2">Breeds with Notable Disease Resistance</h4>
              <ul className="text-sm">
                <li><span className="font-medium">Fayoumi</span> - Strong resistance to Marek's disease and coccidiosis</li>
                <li><span className="font-medium">Asil</span> - Excellent general disease resistance</li>
                <li><span className="font-medium">Leghorn</span> - Good resistance to respiratory diseases</li>
                <li><span className="font-medium">Jungle Fowl</span> - Natural resistance to many poultry diseases</li>
              </ul>
            </div>
          </>
        ),
      },
      {
        id: "behavioral-traits",
        title: "Behavioral Traits",
        description:
          "Temperament, broodiness, and other behavioral characteristics.",
        content: (
          <>
            <p className="mb-4">
              Behavioral traits significantly impact breeding success and management requirements:
            </p>
            <ul className="space-y-2 mb-4">
              <li>
                <span className="font-medium">Broodiness</span> - Tendency to sit on and hatch eggs
              </li>
              <li>
                <span className="font-medium">Temperament</span> - Docility vs. aggression
              </li>
              <li>
                <span className="font-medium">Flightiness</span> - Tendency to fly or attempt escape
              </li>
              <li>
                <span className="font-medium">Foraging behavior</span> - Active vs. passive foraging
              </li>
              <li>
                <span className="font-medium">Maternal instincts</span> - Care of young after hatching
              </li>
            </ul>
            <div className="bg-muted p-3 rounded-md mb-4">
              <h4 className="font-medium mb-2">Behavioral Trait Examples</h4>
              <ul className="text-sm">
                <li><span className="font-medium">Highly broody</span>: Silkie, Cochin, Orpington</li>
                <li><span className="font-medium">Rarely broody</span>: Leghorn, Minorca, Production Reds</li>
                <li><span className="font-medium">Docile</span>: Brahma, Sussex, Orpington</li>
                <li><span className="font-medium">More aggressive</span>: Game breeds, Asil, Malay</li>
              </ul>
            </div>
          </>
        ),
      },
    ],
  };

  // Filter traits based on search query
  const filteredTraits = Object.entries(traits).reduce(
    (acc, [category, categoryTraits]) => {
      const filtered = categoryTraits.filter(
        (trait) =>
          trait.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trait.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    },
    {}
  );

  const hasResults = Object.values(filteredTraits).some(
    (category) => category.length > 0
  );

  const getCategoryIcon = (category) => {
    switch (category) {
      case "genetic":
        return <Dna className="h-5 w-5" />;
      case "production":
        return <Egg className="h-5 w-5" />;
      case "compatibility":
        return <Heart className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Book className="h-6 w-6" />
          Breeding Trait Guide
        </h2>
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search traits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {searchQuery ? (
        <div className="space-y-6">
          {!hasResults ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Info className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Results Found</h3>
                <p className="text-center text-muted-foreground">
                  No traits match your search query. Try different keywords.
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(filteredTraits).map(([category, categoryTraits]) => (
              <div key={category} className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  {getCategoryIcon(category)}
                  {category.charAt(0).toUpperCase() + category.slice(1)} Traits
                </h3>
                <div className="space-y-4">
                  {categoryTraits.map((trait) => (
                    <Card key={trait.id}>
                      <CardHeader className="pb-2">
                        <CardTitle>{trait.title}</CardTitle>
                        <CardDescription>{trait.description}</CardDescription>
                      </CardHeader>
                      <CardContent>{trait.content}</CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="genetic" className="flex items-center gap-2">
              <Dna className="h-4 w-4" />
              Genetic
            </TabsTrigger>
            <TabsTrigger value="production" className="flex items-center gap-2">
              <Egg className="h-4 w-4" />
              Production
            </TabsTrigger>
            <TabsTrigger
              value="compatibility"
              className="flex items-center gap-2"
            >
              <Heart className="h-4 w-4" />
              Compatibility
            </TabsTrigger>
          </TabsList>

          {Object.entries(traits).map(([category, categoryTraits]) => (
            <TabsContent key={category} value={category} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {categoryTraits.map((trait) => (
                  <Card key={trait.id}>
                    <CardHeader>
                      <CardTitle>{trait.title}</CardTitle>
                      <CardDescription>{trait.description}</CardDescription>
                    </CardHeader>
                    <CardContent>{trait.content}</CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default BreedingTraitGuide;

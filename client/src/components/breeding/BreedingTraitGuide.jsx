import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertCircle, BookOpen, Feather, Egg, Star } from "lucide-react";

const BreedingTraitGuide = () => {
  const [activeTab, setActiveTab] = useState("basics");

  return (
    <Card className="shadow-md border-[#ffb464]/30">
      <CardHeader className="bg-gradient-to-r from-[#fff5e8] to-[#ffeed7]">
        <CardTitle className="text-[#a05e2b] flex items-center">
          <BookOpen className="mr-2 h-5 w-5" />
          Breeding Trait Guide
        </CardTitle>
        <CardDescription className="text-[#b06a30]">
          Understanding key traits when selecting breeding stock
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 bg-[#fff5e8] rounded-lg mb-4">
            <TabsTrigger
              value="basics"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#ffb464] data-[state=active]:to-[#ffa040] data-[state=active]:text-white"
            >
              Basics
            </TabsTrigger>
            <TabsTrigger
              value="genetics"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#ffb464] data-[state=active]:to-[#ffa040] data-[state=active]:text-white"
            >
              Genetics
            </TabsTrigger>
            <TabsTrigger
              value="production"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#ffb464] data-[state=active]:to-[#ffa040] data-[state=active]:text-white"
            >
              Production
            </TabsTrigger>
            <TabsTrigger
              value="compatibility"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#ffb464] data-[state=active]:to-[#ffa040] data-[state=active]:text-white"
            >
              Compatibility
            </TabsTrigger>
          </TabsList>

          <div className="pt-5">
            <ScrollArea className="h-[300px] pr-4">
              <TabsContent value="basics" className="mt-0">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-[#a05e2b] hover:text-[#d37b33]">
                      What to look for in breeding stock
                    </AccordionTrigger>
                    <AccordionContent className="text-[#b06a30]">
                      When selecting birds for breeding, prioritize health,
                      vigor, and standard breed conformity. Look for clear eyes,
                      clean nostrils, good feather quality, and strong legs.
                      Avoid birds with visible defects or signs of illness. The
                      best breeding specimens should represent the ideal
                      characteristics of their breed.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-[#a05e2b] hover:text-[#d37b33]">
                      Understanding breeding age
                    </AccordionTrigger>
                    <AccordionContent className="text-[#b06a30]">
                      For most poultry breeds, hens can start breeding at 5-6
                      months of age, while roosters reach sexual maturity at 4-5
                      months. However, it's often best to wait until birds are
                      fully mature (8-10 months) for optimal fertility and to
                      better evaluate their adult characteristics before
                      breeding.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-[#a05e2b] hover:text-[#d37b33]">
                      Breeding ratios
                    </AccordionTrigger>
                    <AccordionContent className="text-[#b06a30]">
                      For chickens, maintain a ratio of 1 rooster to 8-12 hens
                      for optimal fertility. For ducks, 1 drake to 4-6 ducks is
                      ideal. For turkeys, 1 tom can service 6-10 hens. Exceeding
                      these ratios can lead to reduced fertility rates and
                      potential injury to hens from excessive mating.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger className="text-[#a05e2b] hover:text-[#d37b33]">
                      Seasonal breeding considerations
                    </AccordionTrigger>
                    <AccordionContent className="text-[#b06a30]">
                      Many poultry breeds have natural breeding seasons,
                      typically starting in spring as daylight hours increase.
                      Egg production and fertility are usually highest during
                      this period. You can extend breeding season using
                      artificial lighting to maintain 14-16 hours of light
                      daily.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>

              <TabsContent value="genetics" className="mt-0">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-[#a05e2b] hover:text-[#d37b33]">
                      Dominant vs. Recessive traits
                    </AccordionTrigger>
                    <AccordionContent className="text-[#b06a30]">
                      In poultry genetics, dominant traits will always show when
                      present (only one copy needed), while recessive traits
                      only appear when a bird has two copies. For example, pea
                      comb is dominant over single comb, and white feathers are
                      often dominant over colored plumage in many breeds.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-[#a05e2b] hover:text-[#d37b33]">
                      Understanding hybrid vigor
                    </AccordionTrigger>
                    <AccordionContent className="text-[#b06a30]">
                      Hybrid vigor (heterosis) occurs when unrelated breeds are
                      crossed, resulting in offspring with increased health,
                      size, or productivity beyond either parent.
                      First-generation (F1) crosses show the most hybrid vigor.
                      This effect diminishes in subsequent generations, so
                      maintain separate purebred lines for ongoing crosses.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-[#a05e2b] hover:text-[#d37b33]">
                      Sex-linked traits
                    </AccordionTrigger>
                    <AccordionContent className="text-[#b06a30]">
                      Sex-linked traits allow for chick sexing at hatch based on
                      color. Common crosses include Rhode Island Red roosters
                      with Barred Rock hens (producing black sex-links) or Rhode
                      Island Red roosters with Rhode Island White hens
                      (producing red sex-links). Male chicks will be one color
                      and females another.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger className="text-[#a05e2b] hover:text-[#d37b33]">
                      Inbreeding vs. Linebreeding
                    </AccordionTrigger>
                    <AccordionContent className="text-[#b06a30]">
                      Inbreeding (mating close relatives) can fix desirable
                      traits but may lead to reduced vigor and fertility over
                      time. Linebreeding (more distant relatives) provides more
                      moderate trait consolidation with fewer negative effects.
                      For beginners, we recommend outbreeding until you gain
                      experience with genetic principles.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>

              <TabsContent value="production" className="mt-0">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-[#a05e2b] hover:text-[#d37b33]">
                      Egg production traits
                    </AccordionTrigger>
                    <AccordionContent className="text-[#b06a30]">
                      When breeding for egg production, select hens that begin
                      laying early (18-20 weeks), maintain consistent
                      production, and have good laying persistence. Egg size,
                      shell quality, and color consistency are also important
                      traits. Production breeds like Leghorns typically lay
                      250-300 eggs annually, while dual-purpose breeds lay
                      180-250.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-[#a05e2b] hover:text-[#d37b33]">
                      Meat production traits
                    </AccordionTrigger>
                    <AccordionContent className="text-[#b06a30]">
                      For meat production, focus on growth rate, feed conversion
                      efficiency, and carcass yield. The Cornish Cross (Cornish
                      × White Rock) is the industry standard for fast growth,
                      reaching market weight in 6-8 weeks. Heritage breeds grow
                      more slowly but often have better flavor and are better
                      suited for pastured environments.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-[#a05e2b] hover:text-[#d37b33]">
                      Broodiness traits
                    </AccordionTrigger>
                    <AccordionContent className="text-[#b06a30]">
                      Broodiness (the desire to sit on and hatch eggs) has been
                      selectively bred out of modern production breeds. If you
                      want natural reproduction, consider Silkies, Cochins, or
                      Orpingtons, which are excellent broody hens. Some heritage
                      breeds like Dominiques and Plymouth Rocks retain moderate
                      broodiness traits.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger className="text-[#a05e2b] hover:text-[#d37b33]">
                      Foraging ability
                    </AccordionTrigger>
                    <AccordionContent className="text-[#b06a30]">
                      Birds with good foraging ability can find a significant
                      portion of their diet through insects, seeds, and plants,
                      reducing feed costs. Heritage breeds typically excel at
                      foraging, with breeds like Welsummers, Australorps, and
                      Marans being particularly adept. This trait is important
                      for free-range and pasture-based operations.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>

              <TabsContent value="compatibility" className="mt-0">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-[#a05e2b] hover:text-[#d37b33]">
                      Breed compatibility for crossbreeding
                    </AccordionTrigger>
                    <AccordionContent className="text-[#b06a30]">
                      When crossbreeding, birds of similar size work best. Large
                      disparities in size can lead to mating difficulties and
                      potential injury. Roosters should not be significantly
                      larger than hens. For best results, cross breeds with
                      complementary traits – for example, a breed with excellent
                      egg production with one known for cold hardiness.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-[#a05e2b] hover:text-[#d37b33]">
                      Popular breed combinations
                    </AccordionTrigger>
                    <AccordionContent className="text-[#b06a30]">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>
                          Rhode Island Red × Plymouth Rock: Excellent egg-laying
                          with good cold hardiness
                        </li>
                        <li>
                          Sussex × Orpington: Exceptional meat quality with
                          docile temperament
                        </li>
                        <li>
                          Leghorn × Australorp: High egg production with better
                          winter laying
                        </li>
                        <li>
                          Cornish × Plymouth Rock: Fast-growing meat birds
                          (Cornish Cross)
                        </li>
                        <li>
                          Pekin × Muscovy: Produces sterile Mulard ducks with
                          excellent meat quality
                        </li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-[#a05e2b] hover:text-[#d37b33]">
                      Compatibility with existing flock
                    </AccordionTrigger>
                    <AccordionContent className="text-[#b06a30]">
                      When introducing new breeding stock to your flock,
                      consider temperament compatibility. Aggressive breeds may
                      bully gentler ones. Mix birds of similar size and activity
                      level. Always quarantine new birds for at least 30 days
                      before introducing them to prevent disease transmission to
                      your established flock.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger className="text-[#a05e2b] hover:text-[#d37b33]">
                      Climate adaptability
                    </AccordionTrigger>
                    <AccordionContent className="text-[#b06a30]">
                      Match breeds to your climate for best breeding results.
                      Mediterranean breeds (Leghorns, Anconas) tolerate heat
                      well but may struggle in cold. Asian breeds (Brahmas,
                      Cochins) with feathered feet and small combs excel in cold
                      but may suffer in heat. American breeds (Plymouth Rocks,
                      Rhode Island Reds) are generally adaptable to varied
                      climates.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BreedingTraitGuide;

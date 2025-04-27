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
import { Book, CheckCircle2, ChevronRight, Info, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const FirstTimeBreedingTutorial = ({ onComplete }) => {
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [completedModules, setCompletedModules] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(true);

  const modules = [
    {
      id: "intro",
      title: "Introduction to Breeding",
      description: "Learn the basics of poultry breeding",
      content: [
        {
          subtitle: "Understanding Breeding Basics",
          text: "Poultry breeding involves pairing birds with desirable traits to produce offspring with similar or enhanced characteristics. Successful breeding requires knowledge of genetics, proper selection of breeding pairs, and careful management of the breeding environment.",
        },
        {
          subtitle: "Key Terms and Concepts",
          text: "Genetics: The study of heredity and variation in organisms. Phenotype: Observable traits. Genotype: Genetic makeup. Dominant vs Recessive traits: How genes express themselves in offspring.",
        },
        {
          subtitle: "Important Considerations",
          text: "Health: Only breed birds in optimal health. Age: Birds should be mature but not too old. Compatibility: Consider breed standards and genetic diversity. Environment: Proper housing, nutrition, and stress management are essential for successful breeding.",
        },
      ],
    },
    {
      id: "pairs",
      title: "Selecting Breeding Pairs",
      description: "How to choose compatible breeding pairs",
      content: [
        {
          subtitle: "Breed Compatibility",
          text: "Select birds that complement each other's traits. Consider breed standards, desired offspring characteristics, and genetic diversity. Avoid pairing birds with the same defects or weaknesses.",
        },
        {
          subtitle: "Health Requirements",
          text: "Both birds should be in excellent health, free from parasites, respiratory issues, and genetic defects. Ensure breeding birds are fully vaccinated and have been on a proper diet rich in vitamins and minerals.",
        },
        {
          subtitle: "Age Considerations",
          text: "Females should be at least 1 year old before breeding. Males can be ready slightly earlier but should be mature. Avoid breeding birds that are too young or too old, as this can affect fertility and chick health.",
        },
      ],
    },
    {
      id: "setup",
      title: "Setting Up Your Space",
      description: "Preparing the perfect breeding environment",
      content: [
        {
          subtitle: "Space Requirements",
          text: "Breeding pairs need adequate space - at least 4 square feet per bird indoors and 10 square feet per bird in outdoor runs. Provide separate areas for different breeding groups to prevent unwanted mating.",
        },
        {
          subtitle: "Nesting Areas",
          text: "Provide clean, private nesting boxes with soft bedding. Each box should be at least 12x12x12 inches for standard-sized chickens. Position nests away from high traffic areas to reduce stress.",
        },
        {
          subtitle: "Temperature Control",
          text: "Maintain optimal temperature between 65-75°F (18-24°C) for breeding birds. Ensure proper ventilation without drafts. During egg incubation, maintain precise temperature and humidity levels according to species requirements.",
        },
      ],
    },
    {
      id: "health",
      title: "Health & Nutrition",
      description: "Maintaining healthy breeding stock",
      content: [
        {
          subtitle: "Dietary Requirements",
          text: "Breeding birds require higher protein content (16-18%) in their feed. Provide calcium supplements for females to support egg production. Fresh water, probiotics, and balanced nutrition are essential for fertility and healthy offspring.",
        },
        {
          subtitle: "Health Monitoring",
          text: "Perform regular health checks - examine combs, eyes, vents, and feather condition. Watch for signs of stress or disease. Keep detailed records of any health issues for breeding stock selection.",
        },
        {
          subtitle: "Supplement Needs",
          text: "Vitamin E and selenium supplements can improve fertility. B vitamins support embryo development. Ensure proper mineral balance, especially calcium-to-phosphorus ratio for egg development and shell strength.",
        },
      ],
    },
    {
      id: "timeline",
      title: "Breeding Timeline",
      description: "Understanding the breeding cycle",
      content: [
        {
          subtitle: "Mating Period",
          text: "Allow breeding pairs 2-4 weeks together for optimal fertility. One rooster can service 8-12 hens effectively. Collect eggs daily after confirming fertility to begin incubation.",
        },
        {
          subtitle: "Incubation Process",
          text: "Chicken eggs typically incubate for 21 days. Turn eggs at least 3 times daily until day 18. Maintain proper temperature (99.5°F) and humidity (45-50%, increasing to 65% for the last three days).",
        },
        {
          subtitle: "Post-Hatch Care",
          text: "Provide brooder with temperature starting at 95°F, decreasing 5°F weekly. Use starter feed with 20-22% protein for chicks. Monitor for health issues and provide clean water. Allow 4-6 weeks before introducing to flock.",
        },
      ],
    },
  ];

  const progress = Math.round((completedModules.length / modules.length) * 100);

  const handleNextModule = () => {
    // Mark current module as completed if not already
    if (!completedModules.includes(modules[activeModuleIndex].id)) {
      setCompletedModules([...completedModules, modules[activeModuleIndex].id]);
    }

    // Move to next module if available
    if (activeModuleIndex < modules.length - 1) {
      setActiveModuleIndex(activeModuleIndex + 1);
    } else {
      // Tutorial completed
      handleClose();
      if (onComplete) onComplete();
    }
  };

  const handlePreviousModule = () => {
    if (activeModuleIndex > 0) {
      setActiveModuleIndex(activeModuleIndex - 1);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleModuleSelection = (index) => {
    setActiveModuleIndex(index);
  };

  // Current active module
  const currentModule = modules[activeModuleIndex];

  return (
    <>
      <Card className="border-[#ffb464]/30">
        <CardHeader className="bg-gradient-to-r from-[#fff5e8] to-[#ffeed7]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Book className="h-5 w-5 text-[#a05e2b]" />
              <CardTitle className="text-[#a05e2b]">
                Breeding Tutorial
              </CardTitle>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 text-[#b06a30] mb-1">
                <span className="text-sm">Progress</span>
                <span className="text-sm font-medium text-[#a05e2b]">
                  {progress}%
                </span>
              </div>
              <div className="w-32 h-2 bg-[#fff5e8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ffb464]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
          <CardDescription className="text-[#b06a30]">
            Complete the breeding tutorial to get started with breeding
            management
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-start gap-3 mb-6 bg-[#fff5e8] p-4 rounded-lg">
            <Info className="h-5 w-5 text-[#a05e2b] mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-[#a05e2b]">Get Started</h3>
              <p className="text-sm text-[#b06a30] mt-1">
                Learn all about breeding management through our interactive
                tutorial. Complete all modules to unlock advanced breeding
                features.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {modules.map((module, index) => {
              const isCompleted = completedModules.includes(module.id);
              const isActive = index === activeModuleIndex;
              const isLocked =
                index > 0 && !completedModules.includes(modules[index - 1].id);

              return (
                <div
                  key={module.id}
                  className={`p-4 border rounded-lg ${
                    isActive
                      ? "border-[#ffb464] bg-[#fff5e8]"
                      : isLocked
                      ? "border-gray-200 bg-gray-50 opacity-60"
                      : "border-[#ffb464]/30 hover:border-[#ffb464]/60 bg-white"
                  } transition-all cursor-pointer`}
                  onClick={() => !isLocked && handleModuleSelection(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <div className="w-6 h-6 rounded-full bg-[#ffb464] flex items-center justify-center text-white">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      ) : (
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isLocked
                              ? "bg-gray-200 text-gray-400"
                              : "bg-[#fff5e8] text-[#a05e2b] border border-[#ffb464]"
                          }`}
                        >
                          {index + 1}
                        </div>
                      )}
                      <div>
                        <h3
                          className={`font-medium ${
                            isLocked ? "text-gray-400" : "text-[#a05e2b]"
                          }`}
                        >
                          {module.title}
                        </h3>
                        <p
                          className={`text-xs ${
                            isLocked ? "text-gray-400" : "text-[#b06a30]"
                          }`}
                        >
                          {module.description}
                        </p>
                      </div>
                    </div>

                    {!isLocked && (
                      <Button
                        variant="outline"
                        size="sm"
                        className={`${
                          isActive
                            ? "bg-[#ffb464] text-white border-[#ffb464] hover:bg-[#ffa040]"
                            : isCompleted
                            ? "bg-white text-[#a05e2b] border-[#ffb464]"
                            : "bg-white text-[#a05e2b] border-[#ffb464]/30"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsModalOpen(true);
                          handleModuleSelection(index);
                        }}
                      >
                        {isCompleted ? "Review" : "Start"}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between px-6 py-4 bg-[#fff5e8] border-t border-[#ffb464]/10">
          <div className="text-sm text-[#b06a30]">
            {completedModules.length} of {modules.length} modules completed
          </div>
          {completedModules.length === modules.length ? (
            <Button
              onClick={onComplete}
              className="bg-[#ffb464] hover:bg-[#ffa040] text-white"
            >
              Finish Tutorial
            </Button>
          ) : (
            <Button
              onClick={() => {
                setIsModalOpen(true);
                setActiveModuleIndex(completedModules.length);
              }}
              className="bg-[#ffb464] hover:bg-[#ffa040] text-white"
            >
              Continue Learning
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Tutorial Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#a05e2b]">
              <Book className="h-5 w-5" />
              {currentModule?.title}
            </DialogTitle>
            <DialogDescription className="text-[#b06a30]">
              {currentModule?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <Accordion type="single" collapsible className="w-full">
              {currentModule?.content.map((section, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="border-[#ffb464]/20"
                >
                  <AccordionTrigger className="text-[#a05e2b] hover:text-[#a05e2b]/80">
                    {section.subtitle}
                  </AccordionTrigger>
                  <AccordionContent className="text-[#b06a30]">
                    {section.text}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <DialogFooter className="flex justify-between items-center border-t border-[#ffb464]/10 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#b06a30]">
                Module {activeModuleIndex + 1} of {modules.length}
              </span>
              <div className="w-24 h-2 bg-[#fff5e8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ffb464]"
                  style={{
                    width: `${
                      ((activeModuleIndex + 1) / modules.length) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePreviousModule}
                disabled={activeModuleIndex === 0}
                className="border-[#ffb464]/30 text-[#a05e2b]"
              >
                Previous
              </Button>
              <Button
                onClick={handleNextModule}
                className="bg-[#ffb464] hover:bg-[#ffa040] text-white"
              >
                {activeModuleIndex === modules.length - 1 ? "Complete" : "Next"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FirstTimeBreedingTutorial;

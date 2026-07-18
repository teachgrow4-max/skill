export interface SkillCategory {
  slug: string;
  name: string;
  icon: string;
  subcategories: string[];
}

export const skillCategories: SkillCategory[] = [
  {
    slug: "technology",
    name: "Technology",
    icon: "cpu",
    subcategories: ["Programming", "AI", "Machine Learning", "Cybersecurity", "Cloud", "Robotics", "Web Development", "Mobile Development", "DevOps", "Data Science"],
  },
  {
    slug: "design",
    name: "Design",
    icon: "palette",
    subcategories: ["UI/UX", "Graphic Design", "Photography", "Illustration", "Animation", "Product Design"],
  },
  {
    slug: "performing-arts",
    name: "Performing Arts",
    icon: "music",
    subcategories: ["Music", "Dance", "Acting", "Singing", "Instruments"],
  },
  {
    slug: "sports",
    name: "Sports & Fitness",
    icon: "dumbbell",
    subcategories: ["Sports", "Fitness", "Yoga", "Martial Arts", "Athletics"],
  },
  {
    slug: "creative",
    name: "Creative Arts",
    icon: "brush",
    subcategories: ["Art", "Writing", "Content Creation", "Crafts", "Filmmaking"],
  },
  {
    slug: "business",
    name: "Business",
    icon: "briefcase",
    subcategories: ["Entrepreneurship", "Innovation", "Marketing", "Finance", "Sales", "Management"],
  },
  {
    slug: "communication",
    name: "Communication",
    icon: "mic",
    subcategories: ["Public Speaking", "Debate", "Journalism", "Languages"],
  },
  {
    slug: "academic",
    name: "Academic & Research",
    icon: "flask-conical",
    subcategories: ["Research", "Teaching", "Mathematics", "Science"],
  },
  {
    slug: "lifestyle",
    name: "Lifestyle",
    icon: "utensils",
    subcategories: ["Cooking", "Agriculture", "Gaming", "Travel"],
  },
];

export const allSkillNames = skillCategories.flatMap((c) => c.subcategories);

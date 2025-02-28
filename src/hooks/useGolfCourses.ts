import { useState, useEffect } from "react";

// Course names that will be used as seeds for initial courses
const COURSE_NAMES = [
  "Pine Valley",
  "Augusta National",
  "St. Andrews",
  "Pebble Beach",
  "Royal County Down",
  "Cypress Point",
  "Shinnecock Hills",
  "Royal Melbourne",
  "Muirfield",
];

export interface Hole {
  id: string;
  name: string;
  seed: number;
  par: number;
  bestScore?: number;
  completed: boolean;
}

export interface Course {
  id: string;
  name: string;
  holes: Hole[];
  createdAt: number;
  lastPlayed?: number;
}

const STORAGE_KEY = "grid-golf-courses";

// Generate a seed from a string
const generateSeedFromString = (str: string, modifier: number = 0): number => {
  let hash = 0;
  const modifiedStr = `${str}-${modifier}`;
  for (let i = 0; i < modifiedStr.length; i++) {
    const char = modifiedStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Create holes for a course
const createHolesForCourse = (
  courseName: string,
  numHoles: number = 10,
): Hole[] => {
  return Array.from({ length: numHoles }, (_, index) => {
    // Use different seed for each hole by adding a modifier
    const seed = generateSeedFromString(courseName, index + 1);
    return {
      id: `${courseName}-hole-${index + 1}`,
      name: `Hole ${index + 1}`,
      seed,
      par: 3, // Default par
      completed: false,
    };
  });
};

export const useGolfCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load courses from localStorage (only once on mount)
  useEffect(() => {
    const storedCourses = localStorage.getItem(STORAGE_KEY);
    if (storedCourses) {
      setCourses(JSON.parse(storedCourses));
    }
    setInitialized(true);
  }, []);

  // Save courses to localStorage when they change
  useEffect(() => {
    if (initialized && courses.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
    }
  }, [courses, initialized]);

  // Create a new course with 9 holes
  const createCourse = (name: string) => {
    const holes = createHolesForCourse(name);

    const newCourse: Course = {
      id: Date.now().toString(),
      name,
      holes,
      createdAt: Date.now(),
    };

    setCourses((prevCourses) => [...prevCourses, newCourse]);
    return newCourse;
  };

  // Delete a course
  const deleteCourse = (courseId: string) => {
    setCourses((prevCourses) =>
      prevCourses.filter((course) => course.id !== courseId),
    );
  };

  // Generate all predefined courses
  const generateAllCourses = () => {
    const newCourses = COURSE_NAMES.map((name) => {
      const holes = createHolesForCourse(name);

      return {
        id: name,
        name,
        holes,
        createdAt: Date.now(),
      };
    });

    setCourses(newCourses);
    return newCourses;
  };

  // Update hole progress
  const updateHoleProgress = (
    courseId: string,
    holeId: string,
    score: number,
  ) => {
    setCourses((prevCourses) =>
      prevCourses.map((course) => {
        if (course.id === courseId) {
          return {
            ...course,
            holes: course.holes.map((hole) => {
              if (hole.id === holeId) {
                return {
                  ...hole,
                  completed: true,
                  bestScore: hole.bestScore
                    ? Math.min(hole.bestScore, score)
                    : score,
                };
              }
              return hole;
            }),
            lastPlayed: Date.now(),
          };
        }
        return course;
      }),
    );
  };

  // Create default course if none exist
  const ensureCoursesExist = () => {
    if (courses.length === 0) {
      return generateAllCourses();
    }
    return courses;
  };

  return {
    courses,
    initialized,
    createCourse,
    deleteCourse,
    updateHoleProgress,
    ensureCoursesExist,
  };
};

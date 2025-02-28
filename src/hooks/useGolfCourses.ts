import { useState, useEffect } from "react";

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

  // Create a new course
  const createCourse = (name: string) => {
    const newCourse: Course = {
      id: Date.now().toString(),
      name,
      holes: [],
      createdAt: Date.now(),
    };
    setCourses((prevCourses) => [...prevCourses, newCourse]);
    return newCourse;
  };

  // Add a hole to a course
  const addHole = (
    courseId: string,
    holeName: string,
    seed: number,
    par: number = 3,
  ) => {
    setCourses((prevCourses) =>
      prevCourses.map((course) => {
        if (course.id === courseId) {
          const newHole: Hole = {
            id: Date.now().toString(),
            name: holeName,
            seed,
            par,
            completed: false,
          };
          return {
            ...course,
            holes: [...course.holes, newHole],
            lastPlayed: Date.now(),
          };
        }
        return course;
      }),
    );
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

  // Delete a course
  const deleteCourse = (courseId: string) => {
    setCourses((prevCourses) =>
      prevCourses.filter((course) => course.id !== courseId),
    );
  };

  // Create default course if none exist
  const ensureDefaultCourse = () => {
    if (courses.length === 0) {
      const defaultCourse = {
        id: Date.now().toString(),
        name: "First Course",
        holes: Array.from({ length: 9 }, (_, i) => ({
          id: `default-hole-${i + 1}`,
          name: `Hole ${i + 1}`,
          seed: Math.floor(Math.random() * 1000000),
          par: 3,
          completed: false,
        })),
        createdAt: Date.now(),
      };
      setCourses([defaultCourse]);
      return defaultCourse;
    }
    return courses[0];
  };

  return {
    courses,
    initialized,
    createCourse,
    addHole,
    updateHoleProgress,
    deleteCourse,
    ensureDefaultCourse,
  };
};

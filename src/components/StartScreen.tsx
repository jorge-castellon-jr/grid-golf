import React, { useState, useEffect } from "react";
import { useGolfCourses } from "../hooks/useGolfCourses";
import SeedImporter from "./SeedImporter";

interface StartScreenProps {
  onStartGame: (courseId: string, holeId: string, seed: number) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStartGame }) => {
  const {
    courses,
    initialized,
    createCourse,
    addHole,
    deleteCourse,
    ensureDefaultCourse,
  } = useGolfCourses();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [newCourseName, setNewCourseName] = useState("");
  const [showNewCourseInput, setShowNewCourseInput] = useState(false);
  const [showSeedImporter, setShowSeedImporter] = useState(false);

  // Handle initial load - create default course if needed
  useEffect(() => {
    if (initialized && courses.length === 0) {
      const defaultCourse = ensureDefaultCourse();
      setSelectedCourse(defaultCourse.id);
    }
  }, [initialized, courses.length, ensureDefaultCourse]);

  // Set selected course when courses change
  useEffect(() => {
    if (initialized && courses.length > 0 && !selectedCourse) {
      setSelectedCourse(courses[0].id);
    }
  }, [initialized, courses, selectedCourse]);

  const handleCreateCourse = () => {
    if (newCourseName.trim()) {
      const newCourse = createCourse(newCourseName);
      setSelectedCourse(newCourse.id);
      setNewCourseName("");
      setShowNewCourseInput(false);
    }
  };

  const handleAddHole = (courseId: string) => {
    const holeNumber =
      courses.find((c) => c.id === courseId)?.holes.length || 0;
    const holeName = `Hole ${holeNumber + 1}`;
    const seed = Math.floor(Math.random() * 1000000);
    addHole(courseId, holeName, seed);
  };

  const handleImportSeed = (seed: number) => {
    if (selectedCourse) {
      const holeNumber =
        courses.find((c) => c.id === selectedCourse)?.holes.length || 0;
      const holeName = `Hole ${holeNumber + 1} (Imported)`;
      addHole(selectedCourse, holeName, seed);
      setShowSeedImporter(false);
    }
  };

  const exportSeed = (seed: number) => {
    navigator.clipboard
      .writeText(seed.toString())
      .then(() => {
        alert("Seed copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        alert("Seed: " + seed);
      });
  };

  // Don't render until initialized
  if (!initialized) {
    return <div className="loading">Loading...</div>;
  }

  const selectedCourseData = courses.find((c) => c.id === selectedCourse);

  return (
    <div className="start-screen">
      <h1>Grid Golf</h1>

      <div className="course-selector">
        <h2>Select Course</h2>
        <div className="course-list">
          {courses.map((course) => (
            <div
              key={course.id}
              className={`course-item ${selectedCourse === course.id ? "selected" : ""}`}
              onClick={() => setSelectedCourse(course.id)}
            >
              <div className="course-details">
                <h3>{course.name}</h3>
                <p>{course.holes.length} holes</p>
                {course.lastPlayed && (
                  <p className="last-played">
                    Last played:{" "}
                    {new Date(course.lastPlayed).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                className="delete-course-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete course "${course.name}"?`)) {
                    deleteCourse(course.id);
                    if (selectedCourse === course.id && courses.length > 1) {
                      setSelectedCourse(
                        courses[0].id !== course.id
                          ? courses[0].id
                          : courses[1].id,
                      );
                    }
                  }
                }}
              >
                Delete
              </button>
            </div>
          ))}

          {showNewCourseInput ? (
            <div className="new-course-input">
              <input
                type="text"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="Course name"
                autoFocus
              />
              <button onClick={handleCreateCourse}>Create</button>
              <button onClick={() => setShowNewCourseInput(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="add-course-btn"
              onClick={() => setShowNewCourseInput(true)}
            >
              + Add New Course
            </button>
          )}
        </div>
      </div>

      {selectedCourseData && (
        <div className="hole-selector">
          <div className="hole-header">
            <h2>Select Hole</h2>
            <button
              className="import-seed-btn"
              onClick={() => setShowSeedImporter(true)}
            >
              Import Seed
            </button>
          </div>
          <div className="hole-list">
            {selectedCourseData.holes.map((hole) => (
              <div key={hole.id} className="hole-item">
                <div className="hole-details">
                  <h3>{hole.name}</h3>
                  {hole.bestScore && (
                    <p>
                      Best: {hole.bestScore}{" "}
                      {hole.bestScore === 1 ? "stroke" : "strokes"}
                    </p>
                  )}
                </div>
                <div className="hole-actions">
                  <button
                    className="export-seed-btn"
                    onClick={() => exportSeed(hole.seed)}
                  >
                    Export Seed
                  </button>
                  <button
                    className="play-hole-btn"
                    onClick={() =>
                      onStartGame(selectedCourseData.id, hole.id, hole.seed)
                    }
                  >
                    Play
                  </button>
                </div>
              </div>
            ))}
            <button
              className="add-hole-btn"
              onClick={() => handleAddHole(selectedCourseData.id)}
            >
              + Add New Hole
            </button>
          </div>
        </div>
      )}

      {showSeedImporter && (
        <div className="modal-overlay">
          <div className="modal seed-modal">
            <SeedImporter
              onImport={handleImportSeed}
              onCancel={() => setShowSeedImporter(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StartScreen;

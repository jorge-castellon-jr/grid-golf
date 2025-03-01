import React, { useState, useEffect } from "react";
import { useGolfCourses } from "../hooks/useGolfCourses";
import "./StartScreen.css"; // We'll add a separate CSS file

interface StartScreenProps {
  onStartGame: (courseId: string, holeId: string, seed: number) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStartGame }) => {
  const {
    courses,
    initialized,
    createCourse,
    deleteCourse,
    ensureCoursesExist,
  } = useGolfCourses();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [newCourseName, setNewCourseName] = useState("");
  const [showNewCourseInput, setShowNewCourseInput] = useState(false);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [currentHoleCreation, setCurrentHoleCreation] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [animations, setAnimations] = useState<
    { type: string; x: number; y: number }[]
  >([]);

  // Handle initial load - ensure courses exist
  useEffect(() => {
    if (initialized && courses.length === 0) {
      const availableCourses = ensureCoursesExist();
      if (availableCourses.length > 0) {
        setSelectedCourse(availableCourses[0].id);
      }
    }
  }, [initialized, courses.length, ensureCoursesExist]);

  // Set selected course when courses change
  useEffect(() => {
    if (initialized && courses.length > 0 && !selectedCourse) {
      setSelectedCourse(courses[0].id);
    }
  }, [initialized, courses, selectedCourse]);

  // Add random ambient animations
  useEffect(() => {
    const interval = setInterval(() => {
      const randomX = Math.floor(Math.random() * window.innerWidth);
      const randomY = Math.floor((Math.random() * window.innerHeight) / 2);
      const animationTypes = ["butterfly", "leaf", "bird"];
      const randomType =
        animationTypes[Math.floor(Math.random() * animationTypes.length)];

      // Add animation
      setAnimations((prev) => [
        ...prev,
        {
          type: randomType,
          x: randomX,
          y: randomY,
        },
      ]);

      // Remove animation after it completes
      setTimeout(() => {
        setAnimations((prev) => prev.slice(1));
      }, 10000);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleCreateCourse = () => {
    if (newCourseName.trim()) {
      setIsCreatingCourse(true);

      // Simulate creation of 10 holes with animation
      let holeCount = 0;
      const interval = setInterval(() => {
        holeCount++;
        setCurrentHoleCreation(holeCount);

        if (holeCount >= 10) {
          clearInterval(interval);

          // Actually create the course
          const newCourse = createCourse(newCourseName);
          setSelectedCourse(newCourse.id);
          setNewCourseName("");
          setShowNewCourseInput(false);

          // Hide animation after a brief delay
          setTimeout(() => {
            setIsCreatingCourse(false);
            setCurrentHoleCreation(0);
          }, 500);
        }
      }, 200); // Update every 200ms
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    // If we're deleting the currently selected course
    if (selectedCourse === courseId) {
      // Find another course to select
      const otherCourses = courses.filter((c) => c.id !== courseId);
      if (otherCourses.length > 0) {
        setSelectedCourse(otherCourses[0].id);
      } else {
        setSelectedCourse(null);
      }
    }

    // Delete the course
    deleteCourse(courseId);
    setShowDeleteConfirm(null);
  };

  // Don't render until initialized
  if (!initialized) {
    return <div className="loading">Loading courses...</div>;
  }

  const selectedCourseData = courses.find((c) => c.id === selectedCourse);

  return (
    <div className="start-screen">
      {/* Ambient animations */}
      <div className="ambient-animations">
        {animations.map((animation, index) => (
          <div
            key={index}
            className={`ambient-element ${animation.type}`}
            style={{
              left: `${animation.x}px`,
              top: `${animation.y}px`,
            }}
          />
        ))}
      </div>

      {/* Background elements */}
      <div className="background-elements">
        <div className="sun"></div>
        <div className="cloud cloud-1"></div>
        <div className="cloud cloud-2"></div>
        <div className="cloud cloud-3"></div>
        <div className="start-tree tree-1"></div>
        <div className="start-tree tree-2"></div>
        <div className="grass"></div>
      </div>

      <div className="content-container">
        <h1>Cozy Golf</h1>

        <div className="course-selector">
          <h2>Select Course</h2>
          <div className="course-list">
            {courses.map((course) => (
              <div
                key={course.id}
                className={`course-item ${selectedCourse === course.id ? "selected" : ""}`}
                onClick={() => setSelectedCourse(course.id)}
              >
                <div className="course-icon">🏝️</div>
                <div className="course-details">
                  <h3>{course.name}</h3>
                  <p>
                    {course.holes.length}{" "}
                    {course.holes.length === 1 ? "hole" : "holes"}
                  </p>
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
                    e.stopPropagation(); // Prevent selecting course when clicking delete
                    setShowDeleteConfirm(course.id);
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
                <div className="input-buttons">
                  <button className="create-btn" onClick={handleCreateCourse}>
                    Create
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => setShowNewCourseInput(false)}
                  >
                    Cancel
                  </button>
                </div>
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
            <h2>Select Hole</h2>
            <div className="hole-list">
              {selectedCourseData.holes.map((hole) => (
                <div
                  key={hole.id}
                  className={`hole-item ${hole.completed ? "completed" : ""}`}
                >
                  <div className="hole-icon">⛳</div>
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
            </div>
          </div>
        )}
      </div>

      {/* Course creation animation overlay */}
      {isCreatingCourse && (
        <div className="new-course-animation">
          <h2>Creating {newCourseName}</h2>
          <div className="loading-holes">
            <div className="loading-spinner"></div>
            <p>Creating hole {currentHoleCreation} of 10</p>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <h2>Delete Course</h2>
            <p>
              Are you sure you want to delete this course? This action cannot be
              undone.
            </p>
            <div className="modal-buttons">
              <button
                className="delete-confirm-btn"
                onClick={() => handleDeleteCourse(showDeleteConfirm)}
              >
                Delete
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartScreen;

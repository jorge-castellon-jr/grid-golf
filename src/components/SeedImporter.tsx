import React, { useState } from "react";

interface SeedImporterProps {
  onImport: (seed: number) => void;
  onCancel: () => void;
}

const SeedImporter: React.FC<SeedImporterProps> = ({ onImport, onCancel }) => {
  const [seedInput, setSeedInput] = useState("");
  const [error, setError] = useState("");

  const handleImport = () => {
    const parsedSeed = parseInt(seedInput.trim(), 10);

    if (isNaN(parsedSeed)) {
      setError("Please enter a valid number");
      return;
    }

    onImport(parsedSeed);
  };

  return (
    <div className="seed-importer">
      <h3>Import Seed</h3>
      <p>Enter a seed number to create a hole with specific layout</p>

      <div className="input-group">
        <input
          type="text"
          value={seedInput}
          onChange={(e) => {
            setSeedInput(e.target.value);
            setError("");
          }}
          placeholder="Enter seed number"
          autoFocus
        />
        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="button-group">
        <button onClick={handleImport} className="import-btn">
          Import
        </button>
        <button onClick={onCancel} className="cancel-btn">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default SeedImporter;

import React, { useState } from "react";
import useCompetitionData from "../hooks/useCompetitionData";
import "./GuessLeaderCard.css";

function GuessLeaderCard({ code }) {
  const data = useCompetitionData(code);
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState(null);

  if (!data) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedLeader = data.leader?.trim().toLowerCase();
    if (!normalizedLeader) return;

    if (normalizedGuess === normalizedLeader) {
      setResult("✅ Correto!");
    } else {
      setResult(`❌ Errado. O líder atual é ${data.leader}`);
    }
  };

  return (
    <div className="guess-card">
      {data.icon && <img src={data.icon} alt={`${data.name} logo`} className="competition-icon" />}
      <h3>{data.name}</h3>
      <p>{data.country}</p>
      {data.flag && <img src={data.flag} alt={`${data.country} flag`} className="competition-flag" />}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Adivinha o líder..."
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
        />
        <button type="submit">Validar</button>
      </form>
      {result && <p className="result">{result}</p>}
    </div>
  );
}

export default GuessLeaderCard;

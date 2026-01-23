import React from "react";
import "./CompetitionCard.css";

function CompetitionCard({
  code,
  year,
  onSelectClub,
  finalResult,
  userChoice,
  competitionsData,
  leadersData
}) {
  const competition = competitionsData.competitions[code];
  if (!competition) return null;

  const season = competition.history.find(h => h.year === year);
  if (!season) return <p className="no-data">Sem dados para {year}</p>;

  const result = finalResult ? finalResult.find(r => r.code === code) : null;
  const champion = season.winner?.name || season.winner;

  let borderClass = "";
  if (result) {
    if (result.correct) borderClass = "correct-border";
    else if (result.userChoice) borderClass = "wrong-border";
    else borderClass = "pending-border";
  }

  const leaderInfo = leadersData?.[code];
  const leaderName = leaderInfo?.team;
  const leaderCrest = leaderInfo?.crest;
  const leaderPoints = leaderInfo?.points;

  return (
    <div className={`competition-card ${borderClass}`}>
      <h3>{competition.name || code}</h3>

      {/* Caso época em curso (sem campeão definido) */}
      {!champion && (
        <div className="ongoing">
          <p className="ongoing-label">🕐 Época em curso</p>
          {leaderInfo && (
            <div className="leader-info">
              {leaderCrest && (
                <img
                  src={leaderCrest}
                  alt={leaderName}
                  className="competition-icon"
                />
              )}
              <p>
                Líder atual:{" "}
                <strong>
                  {leaderName}
                  {leaderPoints !== undefined && leaderPoints !== null
                    ? ` — ${leaderPoints} pts`
                    : ""}
                </strong>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Antes da submissão → mostra escolha do utilizador */}
      {!result && userChoice && (
        <div className="competition-info">
          <p>Escolhido: {userChoice}</p>
        </div>
      )}

      {/* Lista de clubes para escolher (antes de submeter) */}
      {!result && (
        <div className="champions-list">
          {Object.keys(competition.totals || {}).map(clubName => (
            <button
              key={clubName}
              className={`champion-option ${
                userChoice === clubName ? "selected" : ""
              }`}
              onClick={() => onSelectClub(clubName)}
            >
              {clubName}
            </button>
          ))}
        </div>
      )}

      {/* Depois de submetido → mostra vencedor real */}
      {result && champion && (
        <div className="final-result">
          <p>
            Campeão {season.season}: <strong>{champion}</strong>
          </p>
          {season.winner?.crest && (
            <img
              src={season.winner.crest}
              alt={champion}
              className="competition-icon"
            />
          )}
        </div>
      )}
    </div>
  );
}

export default CompetitionCard;

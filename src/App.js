import React, { useState, useEffect } from "react";
import YearSelector from "./components/YearSelector.jsx";
import CompetitionCard from "./components/CompetitionCard.jsx";
import "./App.css";

// Sessão local estilo Wordle
function saveSession(state) {
  localStorage.setItem("guessChampionSession", JSON.stringify(state));
}

function loadSession() {
  const data = localStorage.getItem("guessChampionSession");
  return data ? JSON.parse(data) : null;
}

function App() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [userChoices, setUserChoices] = useState({});
  const [finalResult, setFinalResult] = useState(null);
  const [competitionsData, setCompetitionsData] = useState(null);
  const [leadersData, setLeadersData] = useState(null);

  const allowedCompetitions = [
    "CL", "PL", "PD", "SA", "FL1", "PPL", "DED", "BL1", "BSA", "WC", "EC"
  ];

  useEffect(() => {
    async function fetchCompetitions() {
      try {
        const res = await fetch("/api/update-competitions");
        const data = await res.json();
        setCompetitionsData({ competitions: data });
      } catch (err) {
        console.error("Erro ao buscar dados do Worker:", err);
      }
    }

    async function fetchLeaders() {
      try {
        const res = await fetch("/api/current-leaders");
        const data = await res.json();
        setLeadersData(data);
      } catch (err) {
        console.error("Erro ao buscar líderes atuais:", err);
      }
    }

    const session = loadSession();
    if (session) {
      setUserChoices(session.userChoices || {});
      setSelectedYear(session.selectedYear || currentYear);
      setFinalResult(session.finalResult || null);
    } else {
      setUserChoices({});
      setSelectedYear(currentYear);
      setFinalResult(null);
    }

    fetchCompetitions();
    fetchLeaders();
  }, [currentYear]); // corre só no mount → elimina warning do ESLint

  if (!competitionsData) return <p>Carregando dados...</p>;

  const competitionCodes = Object.entries(competitionsData.competitions)
    .filter(([code, comp]) =>
      allowedCompetitions.includes(code) &&
      comp.history.some(h => h.year === selectedYear)
    )
    .map(([code]) => code);

  const handleChoice = (competitionCode, clubName) => {
    const updatedChoices = {
      ...userChoices,
      [competitionCode]: clubName
    };
    setUserChoices(updatedChoices);

    saveSession({
      userChoices: updatedChoices,
      selectedYear,
      finalResult
    });
  };

  const handleSubmitAll = () => {
    const results = competitionCodes.map(code => {
      const competition = competitionsData.competitions[code];
      const season = competition.history.find(h => h.year === selectedYear);
      const champion = season?.winner?.name || season?.winner || null;
      const userChoice = userChoices[code];
      const correct = season && userChoice === champion;

      return {
        competition: competition.name || code,
        code,
        year: selectedYear,
        userChoice,
        correct,
        champion,
        streak: season?.streak || 0,
        titles: season?.titles || 0
      };
    });

    setFinalResult(results);

    saveSession({
      userChoices,
      selectedYear,
      finalResult: results
    });
  };

  const handleShare = () => {
    if (!finalResult) return;
    const correctCount = finalResult.filter(r => r.correct).length;
    const total = finalResult.length;
    const percent = Math.round((correctCount / total) * 100);

    const shareText = `⚽ Guess The Champion
Ano ${selectedYear}: ${finalResult.map(r =>
      r.correct ? "✅" : "❌"
    ).join(" ")}

Acertei ${correctCount}/${total} escolhas (${percent}%).
Joga também neste ano: https://guessthechampion.com/play/${selectedYear}`;

    navigator.clipboard.writeText(shareText).then(() => {
      alert("Texto de partilha copiado para a área de transferência!");
    });
  };

  const half = Math.ceil(competitionCodes.length / 2);
  const topRow = competitionCodes.slice(0, half);
  const bottomRow = competitionCodes.slice(half);

  return (
    <div className="app">
      <h1>⚽ Guess The Champion</h1>

      <YearSelector
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        competitionsData={competitionsData}
      />

      <p>Ano selecionado: {selectedYear}</p>

      <div className="competition-row">
        {topRow.map(code => (
          <div key={code} className="competition-block">
            <CompetitionCard
              code={code}
              year={selectedYear}
              onSelectClub={(clubName) => handleChoice(code, clubName)}
              finalResult={finalResult}
              userChoice={userChoices[code]}
              competitionsData={competitionsData}
              leadersData={leadersData}
            />
          </div>
        ))}
      </div>

      <div className="competition-row">
        {bottomRow.map(code => (
          <div key={code} className="competition-block">
            <CompetitionCard
              code={code}
              year={selectedYear}
              onSelectClub={(clubName) => handleChoice(code, clubName)}
              finalResult={finalResult}
              userChoice={userChoices[code]}
              competitionsData={competitionsData}
              leadersData={leadersData}
            />
          </div>
        ))}
      </div>

      {!finalResult && (
        <button className="submit-all-btn" onClick={handleSubmitAll}>
          Submeter todas as escolhas
        </button>
      )}

      {finalResult && (
        <div className="final-result">
          <h2>📊 Resultado Final</h2>
          <ul>
            {finalResult.map((res, idx) => (
              <li key={idx}>
                <strong>{res.competition} ({res.year}):</strong>{" "}
                {res.userChoice
                  ? res.correct
                    ? "✅ Correto"
                    : "❌ Errado"
                  : "— Sem escolha"}
              </li>
            ))}
          </ul>
          <button className="share-btn" onClick={handleShare}>📤 Partilhar</button>
        </div>
      )}
    </div>
  );
}

export default App;

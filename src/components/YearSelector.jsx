import React from "react";
import "./YearSelector.css";

function YearSelector({ selectedYear, onYearChange, competitionsData }) {
  const currentYear = new Date().getFullYear();

  // Extrair todos os anos disponíveis das competições vindas do Worker
  const allYears = competitionsData
    ? Array.from(
        new Set(
          Object.values(competitionsData.competitions)
            .flatMap(comp => comp.history.map(h => h.year))
        )
      )
        .filter(year => year <= currentYear)
        .sort((a, b) => b - a)
    : [];

  const recentYears = allYears.filter(y => y >= currentYear - 30);

  const changeYear = (delta) => {
    const idx = allYears.indexOf(selectedYear);
    if (idx === -1) {
      // fallback: se o ano não existir nos dados, recua/avança diretamente
      onYearChange(selectedYear + delta);
      return;
    }
    const newIdx = idx + delta;
    if (newIdx >= 0 && newIdx < allYears.length) {
      onYearChange(allYears[newIdx]);
    }
  };

  const randomYear = () => {
    const rand = recentYears[Math.floor(Math.random() * recentYears.length)];
    onYearChange(rand);
  };

  return (
    <div className="year-selector">
      <button onClick={() => changeYear(-1)}>◀</button>
      <select
        id="year"
        value={selectedYear}
        onChange={(e) => onYearChange(parseInt(e.target.value))}
      >
        {allYears.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
      <button onClick={() => changeYear(1)}>▶</button>
      <button onClick={randomYear}>🔄 Random (últimos 30 anos)</button>
    </div>
  );
}

export default YearSelector;

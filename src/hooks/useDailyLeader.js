import { useEffect, useState } from "react";
import { getStandings } from "../api";

function useDailyLeader(code) {
  const [leader, setLeader] = useState(null);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const cacheKey = `leader_${code}_${today}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      setLeader(cached);
    } else {
      getStandings(code).then(data => {
        const leaderTeam = data.standings[0].table[0].team.name;
        setLeader(leaderTeam);
        localStorage.setItem(cacheKey, leaderTeam);
      });
    }
  }, [code]);

  return leader;
}

export default useDailyLeader;

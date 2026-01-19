import { useState, useEffect } from "react";
import competitionsData from "../data/competitions.json";
import useDailyLeader from "./useDailyLeader";

function useCompetitionData(code) {
  const [competition, setCompetition] = useState(null);
  const leader = useDailyLeader(code);

  useEffect(() => {
    if (code && competitionsData.competitions[code]) {
      const comp = competitionsData.competitions[code];
      setCompetition({
        name: comp.name,
        country: comp.country,
        icon: comp.icon,
        flag: comp.flag,
        leader: leader
      });
    } else {
      setCompetition(null);
    }
  }, [code, leader]);

  return competition;
}

export default useCompetitionData;

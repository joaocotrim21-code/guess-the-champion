import { useState, useEffect } from "react";
import teamsData from "../data/teams.json";

function useTeamLogo(teamName) {
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    if (teamName && teamsData[teamName]) {
      setLogo(teamsData[teamName].crest);
    } else {
      setLogo(null);
    }
  }, [teamName]);

  return logo;
}

export default useTeamLogo;

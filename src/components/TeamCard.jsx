import React from "react";
import useTeamLogo from "../hooks/useTeamLogo";
import "./TeamCard.css";

function TeamCard({ name }) {
  const logo = useTeamLogo(name);

  return (
    <div className="team-card">
      {logo ? (
        <img src={logo} alt={`${name} logo`} className="team-logo" />
      ) : (
        <div className="team-logo-placeholder">🏳️</div>
      )}
      <h4>{name}</h4>
    </div>
  );
}

export default TeamCard;

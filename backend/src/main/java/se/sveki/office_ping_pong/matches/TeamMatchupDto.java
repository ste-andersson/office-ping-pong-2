package se.sveki.office_ping_pong.matches;

public record TeamMatchupDto(
        String opponentTeam,
        long matchesPlayed,
        long wins,
        long winRate
) {
}

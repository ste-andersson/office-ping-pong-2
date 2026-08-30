package se.sveki.office_ping_pong.matches;

public record TeamStandingsDto(
        String team,
        long matchesPlayed,
        long wins,
        long winRate
) {
}

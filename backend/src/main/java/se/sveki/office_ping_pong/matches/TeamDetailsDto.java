package se.sveki.office_ping_pong.matches;

import java.util.List;

public record TeamDetailsDto(
        String team,
        int rank,
        long matchesPlayed,
        long wins,
        long winRate,
        long pointsFor,
        long pointsAgainst,
        List<String> form,
        List<TeamMatchupDto> matchups,
        List<MatchResponseDto> matches
) {
}

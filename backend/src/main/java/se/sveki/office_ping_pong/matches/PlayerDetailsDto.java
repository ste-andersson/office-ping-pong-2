package se.sveki.office_ping_pong.matches;

import java.util.List;

public record PlayerDetailsDto(
        long playerId,
        String name,
        String avatar,
        String team,
        int rank,
        long matchesPlayed,
        long wins,
        long winRate,
        long totalPoints,
        List<String> form,
        List<PlayerMatchSummaryDto> matches
) {
}

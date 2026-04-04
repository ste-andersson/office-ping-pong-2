package se.sveki.office_ping_pong.matches;

public record StandingsDto(
        long playerId,
        String playerName,
        String playerAvatar,
        long matchesPlayed,
        long wins,
        long winRate
) {
}

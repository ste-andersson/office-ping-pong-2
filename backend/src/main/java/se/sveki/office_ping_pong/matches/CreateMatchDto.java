package se.sveki.office_ping_pong.matches;

public record CreateMatchDto(
        long topPlayerId,
        long bottomPlayerId,
        int topPlayerScore,
        int bottomPlayerScore) {
}

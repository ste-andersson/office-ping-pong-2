package se.sveki.office_ping_pong.matches;

import java.time.LocalDateTime;

public record PlayerMatchSummaryDto(
        long matchId,
        LocalDateTime playedAt,
        long opponentId,
        String opponentName,
        String opponentAvatar,
        String opponentTeam,
        int playerScore,
        int opponentScore
) {
}

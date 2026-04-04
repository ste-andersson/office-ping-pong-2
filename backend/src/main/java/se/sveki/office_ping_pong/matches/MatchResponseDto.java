package se.sveki.office_ping_pong.matches;

import java.time.LocalDateTime;

public record MatchResponseDto(
        long id,
        String topPlayerName,
        String bottomPlayerName,
        String topPlayerAvatar,
        String bottomPlayerAvatar,
        int topPlayerScore,
        int bottomPlayerScore,
        LocalDateTime playedAt
) {
}

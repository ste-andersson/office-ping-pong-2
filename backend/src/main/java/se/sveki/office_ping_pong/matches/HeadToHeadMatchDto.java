package se.sveki.office_ping_pong.matches;

import java.time.LocalDateTime;

public record HeadToHeadMatchDto(
        long id,
        LocalDateTime playedAt,
        int topPlayerScore,
        int bottomPlayerScore
) {
}

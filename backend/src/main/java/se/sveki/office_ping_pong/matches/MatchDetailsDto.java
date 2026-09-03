package se.sveki.office_ping_pong.matches;

import java.time.LocalDateTime;

public record MatchDetailsDto(
        long id,
        LocalDateTime playedAt,
        PlayerMatchInfoDto topPlayer,
        PlayerMatchInfoDto bottomPlayer,
        int topPlayerScore,
        int bottomPlayerScore,
        HeadToHeadDto headToHead,
        boolean deletable
) {
}

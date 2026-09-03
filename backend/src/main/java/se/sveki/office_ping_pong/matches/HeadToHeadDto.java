package se.sveki.office_ping_pong.matches;

import java.util.List;

public record HeadToHeadDto(
        long topPlayerWins,
        long bottomPlayerWins,
        List<HeadToHeadMatchDto> previousMatches
) {
}

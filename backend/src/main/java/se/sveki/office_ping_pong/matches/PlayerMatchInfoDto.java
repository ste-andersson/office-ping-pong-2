package se.sveki.office_ping_pong.matches;

import java.util.List;

public record PlayerMatchInfoDto(
        long playerId,
        String name,
        String avatar,
        String team,
        int rank,
        List<String> form
) {
}

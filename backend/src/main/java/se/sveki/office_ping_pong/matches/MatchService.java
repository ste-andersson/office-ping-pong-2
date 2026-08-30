package se.sveki.office_ping_pong.matches;

import org.springframework.stereotype.Service;
import se.sveki.office_ping_pong.players.PlayerRepository;

import java.util.Comparator;
import java.util.List;

@Service
public class MatchService {

    private final MatchRepository matchRepository;
    private final PlayerRepository playerRepository;

    public MatchService(MatchRepository matchRepository, PlayerRepository playerRepository) {
        this.matchRepository = matchRepository;
        this.playerRepository = playerRepository;
    }

    public void createMatch(CreateMatchDto matchDto) {
        matchRepository.save(new MatchEntity(
                playerRepository.findById(matchDto.topPlayerId())
                        .orElseThrow(() -> new IllegalArgumentException("Top player not found")),
                playerRepository.findById(matchDto.bottomPlayerId())
                        .orElseThrow(() -> new IllegalArgumentException("Bottom player not found")),
                matchDto.topPlayerScore(),
                matchDto.bottomPlayerScore()));
    }

    public List<MatchResponseDto> getAllMatches() {
        return matchRepository.findAllByOrderByPlayedAtDesc()
                .stream()
                .map((match) -> new MatchResponseDto(
                        match.getId(),
                        match.getTopPlayer().getName(),
                        match.getBottomPlayer().getName(),
                        match.getTopPlayer().getAvatar(),
                        match.getBottomPlayer().getAvatar(),
                        match.getTopPlayer().getTeam(),
                        match.getBottomPlayer().getTeam(),
                        match.getTopPlayerScore(),
                        match.getBottomPlayerScore(),
                        match.getPlayedAt()
                )).toList();

    }

    public List<StandingsDto> getStandings() {
        List<MatchEntity> matches = matchRepository.findAll();

        return playerRepository.findAll().stream()
                .map(p -> {
                    long matchesPlayed = matches.stream()
                            .filter(m ->
                                    m.getTopPlayer().equals(p) ||
                                    m.getBottomPlayer().equals(p))
                            .count();

                    long wins = matches.stream()
                            .filter(m ->
                                    (m.getTopPlayer().equals(p) &&
                                            m.getTopPlayerScore() > m.getBottomPlayerScore()) ||
                                            (m.getBottomPlayer().equals(p) &&
                                                    m.getBottomPlayerScore() > m.getTopPlayerScore()))
                            .count();

                    long winRate = matchesPlayed == 0
                            ? 0
                            : Math.round((wins * 100.0) / matchesPlayed);

                    return new StandingsDto(
                            p.getId(),
                            p.getName(),
                            p.getAvatar(),
                            p.getTeam(),
                            matchesPlayed,
                            wins,
                            winRate
                    );
                })
                .filter(standing -> standing.matchesPlayed() > 0)
                .sorted(Comparator
                        .comparingLong(StandingsDto::wins).reversed()
                        .thenComparingLong(StandingsDto::winRate).reversed()
                        .thenComparingLong(StandingsDto::matchesPlayed).reversed())
                .toList();
    }

}

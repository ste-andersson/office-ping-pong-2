package se.sveki.office_ping_pong.matches;

import org.springframework.stereotype.Service;
import se.sveki.office_ping_pong.players.PlayerEntity;
import se.sveki.office_ping_pong.players.PlayerRepository;

import java.time.LocalDateTime;
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

    public List<TeamStandingsDto> getTeamStandings() {
        List<MatchEntity> matches = matchRepository.findAll();
        List<String> teams = List.of("java", "core", "data-ai");

        return teams.stream()
                .map(team -> {
                    long matchesPlayed = matches.stream()
                            .filter(m ->
                                    team.equals(m.getTopPlayer().getTeam()) ||
                                    team.equals(m.getBottomPlayer().getTeam()))
                            .count();

                    long wins = matches.stream()
                            .filter(m ->
                                    (team.equals(m.getTopPlayer().getTeam()) &&
                                            m.getTopPlayerScore() > m.getBottomPlayerScore()) ||
                                            (team.equals(m.getBottomPlayer().getTeam()) &&
                                                    m.getBottomPlayerScore() > m.getTopPlayerScore()))
                            .count();

                    long winRate = matchesPlayed == 0
                            ? 0
                            : Math.round((wins * 100.0) / matchesPlayed);

                    return new TeamStandingsDto(team, matchesPlayed, wins, winRate);
                })
                .sorted(Comparator
                        .comparingLong(TeamStandingsDto::wins).reversed()
                        .thenComparingLong(TeamStandingsDto::winRate).reversed()
                        .thenComparingLong(TeamStandingsDto::matchesPlayed).reversed())
                .toList();
    }

    public MatchDetailsDto getMatchDetails(long matchId) {
        MatchEntity match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found"));

        List<MatchEntity> allMatches = matchRepository.findAll();
        List<StandingsDto> standings = getStandings();

        PlayerMatchInfoDto topInfo = buildPlayerMatchInfo(match.getTopPlayer(), allMatches, standings);
        PlayerMatchInfoDto bottomInfo = buildPlayerMatchInfo(match.getBottomPlayer(), allMatches, standings);
        HeadToHeadDto headToHead = buildHeadToHead(match, allMatches);

        boolean deletable = match.getPlayedAt().isAfter(LocalDateTime.now().minusHours(1));

        return new MatchDetailsDto(
                match.getId(),
                match.getPlayedAt(),
                topInfo,
                bottomInfo,
                match.getTopPlayerScore(),
                match.getBottomPlayerScore(),
                headToHead,
                deletable
        );
    }

    public boolean deleteMatchIfRecent(long matchId) {
        MatchEntity match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found"));

        if (match.getPlayedAt().isBefore(LocalDateTime.now().minusHours(1))) {
            return false;
        }

        matchRepository.delete(match);
        return true;
    }

    private PlayerMatchInfoDto buildPlayerMatchInfo(PlayerEntity player, List<MatchEntity> allMatches, List<StandingsDto> standings) {
        int rank = 1;
        for (StandingsDto standing : standings) {
            if (standing.playerId() == player.getId()) {
                break;
            }
            rank++;
        }

        List<String> form = allMatches.stream()
                .filter(m -> m.getTopPlayer().equals(player) || m.getBottomPlayer().equals(player))
                .sorted(Comparator.comparing(MatchEntity::getPlayedAt))
                .map(m -> isWinner(m, player) ? "W" : "L")
                .toList();
        List<String> lastFive = form.size() > 5 ? form.subList(form.size() - 5, form.size()) : form;

        return new PlayerMatchInfoDto(
                player.getId(),
                player.getName(),
                player.getAvatar(),
                player.getTeam(),
                rank,
                lastFive
        );
    }

    private HeadToHeadDto buildHeadToHead(MatchEntity currentMatch, List<MatchEntity> allMatches) {
        PlayerEntity top = currentMatch.getTopPlayer();
        PlayerEntity bottom = currentMatch.getBottomPlayer();

        List<MatchEntity> previous = allMatches.stream()
                .filter(m -> m.getId() != currentMatch.getId())
                .filter(m ->
                        (m.getTopPlayer().equals(top) && m.getBottomPlayer().equals(bottom)) ||
                                (m.getTopPlayer().equals(bottom) && m.getBottomPlayer().equals(top)))
                .sorted(Comparator.comparing(MatchEntity::getPlayedAt).reversed())
                .toList();

        // the summary tally includes the currently viewed match; the list below it
        // only shows the *other* meetings, since this one is already shown above
        long topWins = previous.stream().filter(m -> isWinner(m, top)).count()
                + (isWinner(currentMatch, top) ? 1 : 0);
        long bottomWins = previous.stream().filter(m -> isWinner(m, bottom)).count()
                + (isWinner(currentMatch, bottom) ? 1 : 0);

        List<HeadToHeadMatchDto> previousMatches = previous.stream()
                .map(m -> {
                    boolean sameOrientation = m.getTopPlayer().equals(top);
                    int topScore = sameOrientation ? m.getTopPlayerScore() : m.getBottomPlayerScore();
                    int bottomScore = sameOrientation ? m.getBottomPlayerScore() : m.getTopPlayerScore();
                    return new HeadToHeadMatchDto(m.getId(), m.getPlayedAt(), topScore, bottomScore);
                })
                .toList();

        return new HeadToHeadDto(topWins, bottomWins, previousMatches);
    }

    private boolean isWinner(MatchEntity match, PlayerEntity player) {
        boolean isTop = match.getTopPlayer().equals(player);
        return isTop
                ? match.getTopPlayerScore() > match.getBottomPlayerScore()
                : match.getBottomPlayerScore() > match.getTopPlayerScore();
    }

}

package se.sveki.office_ping_pong.matches;

import org.springframework.stereotype.Service;
import se.sveki.office_ping_pong.players.PlayerEntity;
import se.sveki.office_ping_pong.players.PlayerRepository;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MatchService {

    private static final double INITIAL_ELO = 1000.0;
    private static final double ELO_K_FACTOR = 32.0;

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
        Map<Long, Double> eloRatings = computeEloRatings(matches);

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

                    long eloRating = Math.round(eloRatings.getOrDefault(p.getId(), INITIAL_ELO));

                    return new StandingsDto(
                            p.getId(),
                            p.getName(),
                            p.getAvatar(),
                            p.getTeam(),
                            matchesPlayed,
                            wins,
                            winRate,
                            eloRating
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
                            .filter(m -> isTeamWinner(m, team))
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

    public TeamDetailsDto getTeamDetails(String team) {
        List<String> teams = List.of("java", "core", "data-ai");
        List<MatchEntity> allMatches = matchRepository.findAll();
        List<TeamStandingsDto> teamStandings = getTeamStandings();

        int rank = 1;
        for (TeamStandingsDto standing : teamStandings) {
            if (standing.team().equals(team)) {
                break;
            }
            rank++;
        }

        List<MatchEntity> teamMatches = allMatches.stream()
                .filter(m -> team.equals(m.getTopPlayer().getTeam()) || team.equals(m.getBottomPlayer().getTeam()))
                .sorted(Comparator.comparing(MatchEntity::getPlayedAt).reversed())
                .toList();

        long matchesPlayed = teamMatches.size();
        long wins = teamMatches.stream().filter(m -> isTeamWinner(m, team)).count();
        long winRate = matchesPlayed == 0
                ? 0
                : Math.round((wins * 100.0) / matchesPlayed);
        // Points scored by this team's player(s) vs. the opponent's, like a
        // football goal difference. A self-matchup (both players on this
        // team) has no external opponent, so both scores count as "for" and
        // nothing is added to "against".
        long pointsFor = teamMatches.stream()
                .mapToLong(m -> {
                    boolean topIsTeam = team.equals(m.getTopPlayer().getTeam());
                    boolean bottomIsTeam = team.equals(m.getBottomPlayer().getTeam());
                    long points = 0;
                    if (topIsTeam) points += m.getTopPlayerScore();
                    if (bottomIsTeam) points += m.getBottomPlayerScore();
                    return points;
                })
                .sum();
        long pointsAgainst = teamMatches.stream()
                .mapToLong(m -> {
                    boolean topIsTeam = team.equals(m.getTopPlayer().getTeam());
                    boolean bottomIsTeam = team.equals(m.getBottomPlayer().getTeam());
                    if (topIsTeam && bottomIsTeam) return 0;
                    if (topIsTeam) return m.getBottomPlayerScore();
                    return m.getTopPlayerScore();
                })
                .sum();

        List<String> form = teamMatches.stream()
                .sorted(Comparator.comparing(MatchEntity::getPlayedAt))
                .map(m -> isTeamWinner(m, team) ? "W" : "L")
                .toList();
        List<String> lastFive = form.size() > 5 ? form.subList(form.size() - 5, form.size()) : form;

        // matchup against every team, including this one: two players from the
        // same team can play each other, and one of them winning still counts
        // as a win for that team in this bucket
        List<TeamMatchupDto> matchups = teams.stream()
                .map(opponent -> {
                    List<MatchEntity> matchupMatches = allMatches.stream()
                            .filter(m ->
                                    (team.equals(m.getTopPlayer().getTeam()) && opponent.equals(m.getBottomPlayer().getTeam())) ||
                                            (team.equals(m.getBottomPlayer().getTeam()) && opponent.equals(m.getTopPlayer().getTeam())))
                            .toList();

                    long matchupPlayed = matchupMatches.size();
                    long matchupWins = matchupMatches.stream().filter(m -> isTeamWinner(m, team)).count();
                    long matchupWinRate = matchupPlayed == 0
                            ? 0
                            : Math.round((matchupWins * 100.0) / matchupPlayed);

                    return new TeamMatchupDto(opponent, matchupPlayed, matchupWins, matchupWinRate);
                })
                .toList();

        List<MatchResponseDto> matches = teamMatches.stream()
                .map(m -> new MatchResponseDto(
                        m.getId(),
                        m.getTopPlayer().getName(),
                        m.getBottomPlayer().getName(),
                        m.getTopPlayer().getAvatar(),
                        m.getBottomPlayer().getAvatar(),
                        m.getTopPlayer().getTeam(),
                        m.getBottomPlayer().getTeam(),
                        m.getTopPlayerScore(),
                        m.getBottomPlayerScore(),
                        m.getPlayedAt()
                ))
                .toList();

        return new TeamDetailsDto(
                team,
                rank,
                matchesPlayed,
                wins,
                winRate,
                pointsFor,
                pointsAgainst,
                lastFive,
                matchups,
                matches
        );
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

    public PlayerDetailsDto getPlayerDetails(long playerId) {
        PlayerEntity player = playerRepository.findById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Player not found"));

        List<MatchEntity> allMatches = matchRepository.findAll();
        List<StandingsDto> standings = getStandings();
        PlayerMatchInfoDto info = buildPlayerMatchInfo(player, allMatches, standings);

        List<MatchEntity> playerMatches = allMatches.stream()
                .filter(m -> m.getTopPlayer().equals(player) || m.getBottomPlayer().equals(player))
                .sorted(Comparator.comparing(MatchEntity::getPlayedAt).reversed())
                .toList();

        long matchesPlayed = playerMatches.size();
        long wins = playerMatches.stream().filter(m -> isWinner(m, player)).count();
        long winRate = matchesPlayed == 0
                ? 0
                : Math.round((wins * 100.0) / matchesPlayed);
        long eloRating = Math.round(computeEloRatings(allMatches).getOrDefault(player.getId(), INITIAL_ELO));
        long pointsFor = playerMatches.stream()
                .mapToLong(m -> m.getTopPlayer().equals(player) ? m.getTopPlayerScore() : m.getBottomPlayerScore())
                .sum();
        long pointsAgainst = playerMatches.stream()
                .mapToLong(m -> m.getTopPlayer().equals(player) ? m.getBottomPlayerScore() : m.getTopPlayerScore())
                .sum();

        List<PlayerMatchSummaryDto> matches = playerMatches.stream()
                .map(m -> toPlayerMatchSummary(m, player))
                .toList();

        return new PlayerDetailsDto(
                info.playerId(),
                info.name(),
                info.avatar(),
                info.team(),
                info.rank(),
                matchesPlayed,
                wins,
                winRate,
                eloRating,
                pointsFor,
                pointsAgainst,
                info.form(),
                matches
        );
    }

    private PlayerMatchSummaryDto toPlayerMatchSummary(MatchEntity match, PlayerEntity player) {
        boolean isTop = match.getTopPlayer().equals(player);
        PlayerEntity opponent = isTop ? match.getBottomPlayer() : match.getTopPlayer();
        int playerScore = isTop ? match.getTopPlayerScore() : match.getBottomPlayerScore();
        int opponentScore = isTop ? match.getBottomPlayerScore() : match.getTopPlayerScore();

        return new PlayerMatchSummaryDto(
                match.getId(),
                match.getPlayedAt(),
                opponent.getId(),
                opponent.getName(),
                opponent.getAvatar(),
                opponent.getTeam(),
                playerScore,
                opponentScore
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

    private Map<Long, Double> computeEloRatings(List<MatchEntity> matches) {
        Map<Long, Double> ratings = new HashMap<>();

        matches.stream()
                .sorted(Comparator.comparing(MatchEntity::getPlayedAt))
                .forEach(match -> {
                    long topId = match.getTopPlayer().getId();
                    long bottomId = match.getBottomPlayer().getId();
                    double topRating = ratings.getOrDefault(topId, INITIAL_ELO);
                    double bottomRating = ratings.getOrDefault(bottomId, INITIAL_ELO);

                    double topExpected = 1.0 / (1.0 + Math.pow(10, (bottomRating - topRating) / 400.0));
                    boolean topWon = match.getTopPlayerScore() > match.getBottomPlayerScore();
                    double topActual = topWon ? 1.0 : 0.0;

                    int scoreDiff = Math.abs(match.getTopPlayerScore() - match.getBottomPlayerScore());
                    double kEffective = ELO_K_FACTOR * Math.log(scoreDiff + 1);

                    ratings.put(topId, topRating + kEffective * (topActual - topExpected));
                    ratings.put(bottomId, bottomRating + kEffective * ((1.0 - topActual) - (1.0 - topExpected)));
                });

        return ratings;
    }

    private boolean isTeamWinner(MatchEntity match, String team) {
        boolean topWinsForTeam = team.equals(match.getTopPlayer().getTeam())
                && match.getTopPlayerScore() > match.getBottomPlayerScore();
        boolean bottomWinsForTeam = team.equals(match.getBottomPlayer().getTeam())
                && match.getBottomPlayerScore() > match.getTopPlayerScore();
        return topWinsForTeam || bottomWinsForTeam;
    }

}

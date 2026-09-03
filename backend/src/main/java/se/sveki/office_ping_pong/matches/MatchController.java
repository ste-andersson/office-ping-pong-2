package se.sveki.office_ping_pong.matches;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/matches")
public class MatchController {

    private final MatchService matchService;

    public MatchController(MatchService matchService) {
        this.matchService = matchService;
    }

    @GetMapping(path = {"/", ""})
    public ResponseEntity<List<MatchResponseDto>> getAllMatches() {
        return ResponseEntity.ok(matchService.getAllMatches());
    }

    @PostMapping(path = {"/", ""})
    public ResponseEntity<Void> createMatch(@RequestBody CreateMatchDto matchDto) {
        matchService.createMatch(matchDto);
        return ResponseEntity.status(201).build();
    }

    @GetMapping(path = {"/standings/", "/standings"})
    public ResponseEntity<List<StandingsDto>> getStandings() {
        return ResponseEntity.ok(matchService.getStandings());
    }

    @GetMapping(path = {"/team-standings/", "/team-standings"})
    public ResponseEntity<List<TeamStandingsDto>> getTeamStandings() {
        return ResponseEntity.ok(matchService.getTeamStandings());
    }

    @GetMapping("/players/{id}")
    public ResponseEntity<PlayerDetailsDto> getPlayerDetails(@PathVariable long id) {
        return ResponseEntity.ok(matchService.getPlayerDetails(id));
    }

    @GetMapping("/teams/{team}")
    public ResponseEntity<TeamDetailsDto> getTeamDetails(@PathVariable String team) {
        return ResponseEntity.ok(matchService.getTeamDetails(team));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MatchDetailsDto> getMatchDetails(@PathVariable long id) {
        return ResponseEntity.ok(matchService.getMatchDetails(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMatch(@PathVariable long id) {
        boolean deleted = matchService.deleteMatchIfRecent(id);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.status(409).build();
    }
}

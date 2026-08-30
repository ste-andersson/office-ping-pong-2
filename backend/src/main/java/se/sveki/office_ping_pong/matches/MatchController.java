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
}

package se.sveki.office_ping_pong.players;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/players")
public class PlayerController {

    private final PlayerService playerService;

    public PlayerController(PlayerService playerService) {
        this.playerService = playerService;
    }

    @GetMapping(path = {"/{id}", "/{id}/"})
    ResponseEntity<PlayerResponseDto> getPlayerById(@PathVariable Long id) {
        try{
            return ResponseEntity.ok(playerService.getPlayerById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping(path = {"/", ""})
    ResponseEntity<List<PlayerResponseDto>> getAllPlayers() {
        return ResponseEntity.ok(playerService.getAllPlayers());
    }
}

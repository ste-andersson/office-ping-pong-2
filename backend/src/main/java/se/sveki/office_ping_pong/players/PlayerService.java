package se.sveki.office_ping_pong.players;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlayerService {

    private final PlayerRepository playerRepository;

    public PlayerService(PlayerRepository playerRepository) {
    this.playerRepository = playerRepository;
    }

    public PlayerResponseDto getPlayerById(Long id) {
        PlayerEntity playerEntity = playerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Player not found"));
        return new PlayerResponseDto(
                playerEntity.getId(),
                playerEntity.getName(),
                playerEntity.getAvatar());
    }

    public List<PlayerResponseDto> getAllPlayers() {
        List<PlayerEntity> entityList = playerRepository.findAllByOrderByIdAsc();
        return entityList.stream().
                map((p) -> new PlayerResponseDto(
                        p.getId(),
                        p.getName(),
                        p.getAvatar()))
                .toList();
    }


}

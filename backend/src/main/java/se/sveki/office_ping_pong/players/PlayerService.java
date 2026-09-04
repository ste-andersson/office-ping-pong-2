package se.sveki.office_ping_pong.players;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlayerService {

    private static final String DEFAULT_TEAM = "core";
    private static final String DEFAULT_AVATAR = "unknown-player-avatar.png";

    private final PlayerRepository playerRepository;

    public PlayerService(PlayerRepository playerRepository) {
    this.playerRepository = playerRepository;
    }

    public PlayerResponseDto createPlayer(CreatePlayerDto dto) {
        PlayerEntity saved = playerRepository.save(
                new PlayerEntity(dto.name().trim(), DEFAULT_AVATAR, DEFAULT_TEAM));
        return new PlayerResponseDto(saved.getId(), saved.getName(), saved.getAvatar(), saved.getTeam());
    }

    public PlayerResponseDto getPlayerById(Long id) {
        PlayerEntity playerEntity = playerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Player not found"));
        return new PlayerResponseDto(
                playerEntity.getId(),
                playerEntity.getName(),
                playerEntity.getAvatar(),
                playerEntity.getTeam());
    }

    public List<PlayerResponseDto> getAllPlayers() {
        List<PlayerEntity> entityList = playerRepository.findAllByOrderByIdAsc();
        return entityList.stream().
                map((p) -> new PlayerResponseDto(
                        p.getId(),
                        p.getName(),
                        p.getAvatar(),
                        p.getTeam()))
                .toList();
    }


}

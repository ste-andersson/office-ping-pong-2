package se.sveki.office_ping_pong.players;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlayerRepository extends JpaRepository<PlayerEntity, Long> {

    List<PlayerEntity> findAllByOrderByIdAsc();

}

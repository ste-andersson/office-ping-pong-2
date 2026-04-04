package se.sveki.office_ping_pong.matches;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatchRepository extends JpaRepository<MatchEntity, Long> {

    List<MatchEntity> findAllByOrderByPlayedAtDesc();
}

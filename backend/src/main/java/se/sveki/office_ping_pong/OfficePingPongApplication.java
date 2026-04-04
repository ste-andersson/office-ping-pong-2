package se.sveki.office_ping_pong;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import se.sveki.office_ping_pong.players.PlayerEntity;
import se.sveki.office_ping_pong.players.PlayerRepository;

@SpringBootApplication
public class OfficePingPongApplication {

	public static void main(String[] args) {
		SpringApplication.run(OfficePingPongApplication.class, args);
	}

	@Bean
	CommandLineRunner seedPlayers(PlayerRepository playerRepository) {
		return args -> {
			if (playerRepository.count() == 0) {
				playerRepository.save(new PlayerEntity("STEFAN", "stefan-avatar.png"));
				playerRepository.save(new PlayerEntity("VENU", "venu-avatar.png"));
				playerRepository.save(new PlayerEntity("MAX", "max-avatar.png"));
				playerRepository.save(new PlayerEntity("SEBASTIAN", "venu-avatar.png"));
			}
		};
	}
}

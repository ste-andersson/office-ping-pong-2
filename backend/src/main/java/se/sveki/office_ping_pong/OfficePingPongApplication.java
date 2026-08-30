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
				// Team: java
				playerRepository.save(new PlayerEntity("STEFAN", "stefan-avatar.png", "java"));
				playerRepository.save(new PlayerEntity("JING X", "jing-avatar.png", "java"));
				playerRepository.save(new PlayerEntity("JAKUB", "jakub-avatar.png", "java"));
				playerRepository.save(new PlayerEntity("SHIRRE", "shirre-avatar.png", "java"));
				playerRepository.save(new PlayerEntity("SEBASTIAN", "sebastian-avatar.png", "java"));
				playerRepository.save(new PlayerEntity("SOFIE", "sofie-avatar.png", "java"));
				playerRepository.save(new PlayerEntity("ALEXANDRA", "alexandra-avatar.png", "java"));
				playerRepository.save(new PlayerEntity("VENU", "venu-avatar.png", "java"));
				playerRepository.save(new PlayerEntity("MATTIAS", "mattias-avatar.png", "java"));
				playerRepository.save(new PlayerEntity("TEHREEM", "tehreem-avatar.png", "java"));

				// Team: core
				playerRepository.save(new PlayerEntity("ALEK", "alek-avatar.png", "core"));
				playerRepository.save(new PlayerEntity("CAMILLA", "camilla-avatar.png", "core"));
				playerRepository.save(new PlayerEntity("DAMIR", "damir-avatar.png", "core"));
				playerRepository.save(new PlayerEntity("DENNIS", "dennis-avatar.png", "core"));
				playerRepository.save(new PlayerEntity("DISA", "disa-avatar.png", "core"));
				playerRepository.save(new PlayerEntity("JULIA", "julia-avatar.png", "core"));
				playerRepository.save(new PlayerEntity("MAGDALENA", "magdalena-avatar.png", "core"));
				playerRepository.save(new PlayerEntity("SARA", "sara-avatar.png", "core"));

				// Team: AI & Data
				playerRepository.save(new PlayerEntity("ABDULLAHI", "abdullahi-avatar.png", "data-ai"));
				playerRepository.save(new PlayerEntity("EMBLA", "embla-avatar.png", "data-ai"));
				playerRepository.save(new PlayerEntity("EMIL", "emil-avatar.png", "data-ai"));
				playerRepository.save(new PlayerEntity("JING Z", "jing-z-avatar.png", "data-ai"));
				playerRepository.save(new PlayerEntity("GHAZALEH", "ghazaleh-avatar.png", "data-ai"));
				playerRepository.save(new PlayerEntity("MIKIAS", "mikias-avatar.png", "data-ai"));
				playerRepository.save(new PlayerEntity("MOHAMED", "mohamed-avatar.png", "data-ai"));
				playerRepository.save(new PlayerEntity("NAZRET", "nazret-avatar.png", "data-ai"));
				playerRepository.save(new PlayerEntity("NORDIN", "nordin-avatar.png", "data-ai"));
				playerRepository.save(new PlayerEntity("ROBIN", "robin-avatar.png", "data-ai"));


			}
		};
	}
}

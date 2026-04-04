package se.sveki.office_ping_pong.matches;

import jakarta.persistence.*;
import se.sveki.office_ping_pong.players.PlayerEntity;

import java.time.LocalDateTime;

@Entity
public class MatchEntity {

    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne
    private PlayerEntity topPlayer;

    @ManyToOne
    private PlayerEntity bottomPlayer;

    private int topPlayerScore;
    private int bottomPlayerScore;
    private LocalDateTime playedAt;

    public MatchEntity(PlayerEntity topPlayer, PlayerEntity bottomPlayer, int topPlayerScore, int bottomPlayerScore) {
        this.topPlayer = topPlayer;
        this.bottomPlayer = bottomPlayer;
        this.topPlayerScore = topPlayerScore;
        this.bottomPlayerScore = bottomPlayerScore;
        this.playedAt = LocalDateTime.now();
    }

    public MatchEntity() {
        // required by JPA
    }

    public long getId() {
        return id;
    }

    public PlayerEntity getTopPlayer() {
        return topPlayer;
    }

    public void setTopPlayer(PlayerEntity topPlayer) {
        this.topPlayer = topPlayer;
    }

    public PlayerEntity getBottomPlayer() {
        return bottomPlayer;
    }

    public void setBottomPlayer(PlayerEntity bottomPlayer) {
        this.bottomPlayer = bottomPlayer;
    }

    public int getTopPlayerScore() {
        return topPlayerScore;
    }

    public void setTopPlayerScore(int topPlayerScore) {
        this.topPlayerScore = topPlayerScore;
    }

    public int getBottomPlayerScore() {
        return bottomPlayerScore;
    }

    public void setBottomPlayerScore(int bottomPlayerScore) {
        this.bottomPlayerScore = bottomPlayerScore;
    }

    public LocalDateTime getPlayedAt() {
        return playedAt;
    }

    public void setPlayedAt(LocalDateTime playedAt) {
        this.playedAt = playedAt;
    }
}

package com.placement.portal.dto;

import java.util.List;

public class FitScoreResponse {
    private int score;
    private String level;
    private List<String> suggestions;

    public FitScoreResponse(int score, String level, List<String> suggestions) {
        this.score = score;
        this.level = level;
        this.suggestions = suggestions;
    }

    public int getScore() { return score; }
    public String getLevel() { return level; }
    public List<String> getSuggestions() { return suggestions; }
}
package com.placement.portal.dto;

import java.util.List;

public class FitScoreResponse {
    private int score;
    private String level;
    private List<String> suggestions;
    private String signature;

    public FitScoreResponse(int score, String level, List<String> suggestions, String signature) {
        this.score = score;
        this.level = level;
        this.suggestions = suggestions;
        this.signature = signature;
    }

    public int getScore() { return score; }
    public String getLevel() { return level; }
    public List<String> getSuggestions() { return suggestions; }
    public String getSignature() { return signature; }
}
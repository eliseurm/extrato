package br.com.extrato.dto;

import lombok.Data;

public class AuthDtos {
    @Data
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @Data
    public static class LoginResponse {
        private String token;
        public LoginResponse(String token) { this.token = token; }
    }
}

package com.ventrya.api.controller;

import java.security.Principal;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/ia")
public class AiController {

    private final ChatClient chatClient;

    public AiController(ChatClient.Builder builder) {
        this.chatClient = builder
            .defaultSystem("""
                Você é a Ventrya IA, assistente virtual do
                aplicativo Ventrya.

                Sua missão é ajudar pessoas a conseguir emprego,
                melhorar currículos, estudar, desenvolver projetos
                e se preparar para entrevistas.

                Responda sempre em português brasileiro.
                Seja clara, acolhedora, prática e objetiva.
                Nunca invente vagas ou oportunidades de emprego.
                """)
            .build();
    }

    public record Pergunta(String mensagem) {}

    public record Resposta(String resposta) {}

    @PostMapping("/chat")
    public Resposta conversar(
        @RequestBody Pergunta pergunta,
        Principal usuario
    ) {
        if (usuario == null) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Faça login para conversar com a IA."
            );
        }

        if (pergunta == null ||
            pergunta.mensagem() == null ||
            pergunta.mensagem().isBlank() ||
            pergunta.mensagem().length() > 1500) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Digite uma mensagem válida de até 1500 caracteres."
            );
        }

        String resposta = chatClient.prompt()
            .user(pergunta.mensagem())
            .call()
            .content();

        return new Resposta(
            resposta == null ? "Não consegui responder." : resposta
        );
    }
}

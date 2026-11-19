
package com.ventrya.api.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.ventrya.api.security.CustomUserDetailsService;
import com.ventrya.api.security.JwtAuthenticationFilter;

import jakarta.servlet.DispatcherType;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;

    // Criptografia das senhas
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Autenticacao dos usuarios
    @Bean
    public AuthenticationManager authenticationManager(
            PasswordEncoder passwordEncoder
    ) {
        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(userDetailsService);

        provider.setPasswordEncoder(passwordEncoder);

        return new ProviderManager(provider);
    }

    // Seguranca e autorizacao da API
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        return http

                // Permite requisicoes do Mobile no navegador
                .cors(Customizer.withDefaults())

                // API JWT sem cookies de sessao
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        .dispatcherTypeMatchers(
                                DispatcherType.ERROR
                        ).permitAll()

                        // Rotas publicas
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/login",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // Rotas administrativas
                        .requestMatchers("/api/admin/**")
                        .hasRole("ADMIN")

                        // Rotas dos estudantes
                        .requestMatchers("/api/applications/**")
                        .hasRole("STUDENT")

                        .requestMatchers("/api/submissions/**")
                        .hasRole("STUDENT")

                        .requestMatchers("/api/feedbacks/**")
                        .hasRole("STUDENT")

                        .requestMatchers("/api/portfolios/**")
                        .hasRole("STUDENT")

                        .requestMatchers("/api/interviews/**")
                        .hasRole("STUDENT")

                        // Perfil autenticado
                        .requestMatchers("/api/users/me")
                        .authenticated()

                        // Consultas autenticadas
                        .requestMatchers(
                                "/api/organizations/**",
                                "/api/challenges/**"
                        ).authenticated()

                        // VENTRYA IA - OLLAMA
                        // Chat disponivel para usuarios autenticados
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/ia/chat"
                        ).authenticated()

                        // Bloqueia todas as demais rotas
                        .anyRequest().denyAll()
                )

                // Tratamento dos erros de autorizacao
                .exceptionHandling(ex -> ex

                        .authenticationEntryPoint(
                                (request, response, exception) ->
                                        response.sendError(
                                                HttpStatus.UNAUTHORIZED.value()
                                        )
                        )

                        .accessDeniedHandler(
                                (request, response, exception) ->
                                        response.sendError(
                                                HttpStatus.FORBIDDEN.value()
                                        )
                        )
                )

                // Validacao do token JWT
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                )

                .build();
    }

    // Configuracao CORS para o Expo Web local
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        // Frontend local
        config.setAllowedOrigins(
                List.of("http://localhost:8081")
        );

        config.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "OPTIONS"
                )
        );

        config.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type"
                )
        );

        // Autenticacao via Bearer Token
        config.setAllowCredentials(false);

        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/api/**",
                config
        );

        return source;
    }
}


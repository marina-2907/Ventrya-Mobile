
package com.ventrya.api.messaging;

import com.ventrya.api.ai.AiGenerationService;
import com.ventrya.api.entity.Application;
import com.ventrya.api.entity.Challenge;
import com.ventrya.api.entity.Interview;
import com.ventrya.api.entity.Submission;
import com.ventrya.api.entity.enums.InterviewStatus;
import com.ventrya.api.repository.InterviewRepository;
import com.ventrya.api.repository.SubmissionRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AiSnapshotService {

    private final SubmissionRepository submissions;
    private final InterviewRepository interviews;

    // ==========================================
    // DADOS DA SUBMISSÃO PARA A IA
    // ==========================================

    @Transactional(readOnly = true)
    public SubmissionData submission(Long id) {

        // Buscar a entrega pelo ID
        Submission submission = submissions.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Submissão não encontrada: " + id
                        )
                );

        // Buscar a inscrição vinculada à entrega
        Application application = submission.getApplication();

        // Buscar o desafio vinculado à inscrição
        Challenge challenge = application.getChallenge();

        // Retornar os dados necessários para a IA
        return new SubmissionData(
                challenge.getTitle(),
                challenge.getRequirements(),
                submission.getDescription()
        );
    }

    // ==========================================
    // DADOS DA ENTREVISTA PARA A IA
    // ==========================================

    @Transactional(readOnly = true)
    public InterviewData interview(Long id) {

        Interview interview = interviews.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Entrevista não encontrada: " + id
                        )
                );

        List<AiGenerationService.InterviewAnswer> answers =
                interview.getQuestions()
                        .stream()
                        .map(question ->
                                new AiGenerationService.InterviewAnswer(
                                        question.getQuestionNumber(),
                                        question.getQuestion(),
                                        question.getAnswer()
                                )
                        )
                        .toList();

        return new InterviewData(
                interview.getStatus(),
                interview.getProfessionalArea().name(),
                answers
        );
    }

    // ==========================================
    // DTOs INTERNOS
    // ==========================================

    public record SubmissionData(
            String title,
            String requirements,
            String description
    ) {
    }

    public record InterviewData(
            InterviewStatus status,
            String area,
            List<AiGenerationService.InterviewAnswer> answers
    ) {
    }
}


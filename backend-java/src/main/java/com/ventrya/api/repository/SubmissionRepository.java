
package com.ventrya.api.repository;

import com.ventrya.api.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubmissionRepository
        extends JpaRepository<Submission, Long> {

    // Verificar se uma inscrição já possui entrega
    boolean existsByApplicationId(Long applicationId);

    // Buscar entrega vinculada a uma inscrição
    Optional<Submission> findByApplicationId(Long applicationId);

}


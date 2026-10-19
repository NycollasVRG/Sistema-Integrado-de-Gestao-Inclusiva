package com.br.CLAI.controller;

import com.br.CLAI.dto.response.TimelineEventDTO;
import com.br.CLAI.service.TimelineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/alunos")
public class TimelineController {

    private final TimelineService timelineService;

    public TimelineController(TimelineService timelineService) {
        this.timelineService = timelineService;
    }

    @GetMapping("/{alunoId}/timeline")
    public ResponseEntity<List<TimelineEventDTO>> buscarTimeline(
            @PathVariable UUID alunoId) {

        return ResponseEntity.ok(
                timelineService.buscarPorAluno(alunoId)
        );
    }
}
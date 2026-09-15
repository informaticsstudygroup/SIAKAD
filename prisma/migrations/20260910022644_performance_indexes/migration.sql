-- CreateIndex
CREATE INDEX "announcements_createdById_idx" ON "announcements"("createdById");

-- CreateIndex
CREATE INDEX "assignments_meetingId_idx" ON "assignments"("meetingId");

-- CreateIndex
CREATE INDEX "assignments_deadline_idx" ON "assignments"("deadline");

-- CreateIndex
CREATE INDEX "attendances_participantId_idx" ON "attendances"("participantId");

-- CreateIndex
CREATE INDEX "batches_isActive_idx" ON "batches"("isActive");

-- CreateIndex
CREATE INDEX "certificates_participantId_idx" ON "certificates"("participantId");

-- CreateIndex
CREATE INDEX "certificates_batchId_idx" ON "certificates"("batchId");

-- CreateIndex
CREATE INDEX "event_registrations_userId_idx" ON "event_registrations"("userId");

-- CreateIndex
CREATE INDEX "events_programId_idx" ON "events"("programId");

-- CreateIndex
CREATE INDEX "meetings_batchId_date_idx" ON "meetings"("batchId", "date");

-- CreateIndex
CREATE INDEX "participant_profiles_batchId_idx" ON "participant_profiles"("batchId");

-- CreateIndex
CREATE INDEX "questions_quizId_order_idx" ON "questions"("quizId", "order");

-- CreateIndex
CREATE INDEX "quiz_attempts_participantId_idx" ON "quiz_attempts"("participantId");

-- CreateIndex
CREATE INDEX "quizzes_batchId_status_idx" ON "quizzes"("batchId", "status");

-- CreateIndex
CREATE INDEX "submissions_participantId_idx" ON "submissions"("participantId");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE INDEX "verification_logs_participantId_idx" ON "verification_logs"("participantId");

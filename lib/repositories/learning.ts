import { one, many, execute } from "@/lib/database/query";

export async function getOrCreateTopic(name: string) {
  const existing = await one<any>(
    "SELECT * FROM learning_topics WHERE LOWER(name) = LOWER(?)",
    name
  );
  if (existing) return existing;
  
  const result = await execute("INSERT INTO learning_topics (name) VALUES (?)", name);
  return {
    id: Number(result.lastInsertRowid),
    name,
    created_at: new Date().toISOString()
  };
}

export async function getTopic(id: number) {
  return await one<any>("SELECT * FROM learning_topics WHERE id = ?", id);
}

export async function archiveTopic(id: number) {
  await execute("UPDATE learning_topics SET archived = 1 WHERE id = ?", id);
}

export async function restoreTopic(id: number) {
  await execute("UPDATE learning_topics SET archived = 0 WHERE id = ?", id);
}

export async function getAllTopics() {
  return await many<any>(`
    SELECT 
      t.id, 
      t.name, 
      t.archived,
      t.created_at,
      COALESCE(SUM(s.duration), 0) as "totalMinutes",
      COUNT(s.id) as "sessionsCount",
      MAX(s.ended_at) as "lastStudiedAt"
    FROM learning_topics t
    LEFT JOIN learning_sessions s ON t.id = s.topic_id AND s.ended_at IS NOT NULL
    GROUP BY t.id, t.name, t.archived, t.created_at
    ORDER BY "lastStudiedAt" DESC NULLS LAST, t.created_at DESC
  `);
}

export async function getTopicSessions(topicId: number) {
  return await many<any>(`
    SELECT * FROM learning_sessions 
    WHERE topic_id = ? 
    ORDER BY started_at DESC
  `, topicId);
}

export async function createLearningSession(topicId: number) {
  // If there's an existing active learning session, terminate it first to prevent duplicates
  const active = await one<any>("SELECT id FROM learning_sessions WHERE ended_at IS NULL LIMIT 1");
  if (active) {
    await terminateLearningSession(active.id);
  }

  const now = new Date().toISOString();
  const result = await execute(`
    INSERT INTO learning_sessions (topic_id, started_at, last_active_at)
    VALUES (?, ?, ?)
  `, topicId, now, now);
  return Number(result.lastInsertRowid);
}

export async function touchLearningSession(id: number) {
  const now = new Date().toISOString();
  await execute("UPDATE learning_sessions SET last_active_at = ? WHERE id = ?", now, id);
}

export async function terminateLearningSession(id: number) {
  const session = await one<any>("SELECT * FROM learning_sessions WHERE id = ?", id);
  if (!session) return;
  
  const now = new Date().toISOString();
  const start = new Date(session.started_at).getTime();
  const end = new Date(now).getTime();
  const duration = Math.max(0, Math.round((end - start) / 60000)); // in minutes
  
  await execute(`
    UPDATE learning_sessions 
    SET ended_at = ?, duration = ?, last_active_at = ?
    WHERE id = ?
  `, now, duration, now, id);
}

export async function updateLearningSessionTimes(id: number, startedAt: string, endedAt: string) {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  const duration = Math.max(0, Math.round((end - start) / 60000));
  await execute(`
    UPDATE learning_sessions 
    SET started_at = ?, ended_at = ?, duration = ?, last_active_at = ?
    WHERE id = ?
  `, startedAt, endedAt, duration, endedAt, id);
}

export async function deleteTopic(id: number) {
  await execute("DELETE FROM learning_sessions WHERE topic_id = ?", id);
  await execute("DELETE FROM learning_topics WHERE id = ?", id);
}

export async function getAllLearningSessions() {
  return await many<any>(`
    SELECT
      s.*,
      t.name AS "topicName"
    FROM learning_sessions s
    JOIN learning_topics t ON s.topic_id = t.id
    ORDER BY s.started_at DESC
  `);
}

export async function getLearningSession(id: number) {
  return await one<any>("SELECT * FROM learning_sessions WHERE id = ?", id);
}

export async function getActiveLearningSessionWithAbandonedStatus() {
  const active = await one<any>(`
    SELECT s.*, t.name as "topicName"
    FROM learning_sessions s
    JOIN learning_topics t ON s.topic_id = t.id
    WHERE s.ended_at IS NULL
    LIMIT 1
  `);

  if (!active) return null;

  await touchLearningSession(active.id);

  const lastActive = new Date(active.last_active_at).getTime();
  const now = Date.now();
  const diffMinutes = (now - lastActive) / 60000;
  const isAbandoned = diffMinutes > 15;

  return {
    id: active.id,
    type: "Learning",
    topicId: active.topic_id,
    topicName: active.topicName,
    startedAt: active.started_at,
    lastActiveAt: active.last_active_at,
    isAbandoned,
    module: "Learning"
  };
}

export async function continueLearningSession(id: number) {
  await touchLearningSession(id);
}

export async function endLearningSessionAtLastActive(id: number) {
  const session = await one<any>("SELECT * FROM learning_sessions WHERE id = ?", id);
  if (!session) return;

  const start = new Date(session.started_at).getTime();
  const lastActive = new Date(session.last_active_at).getTime();
  const duration = Math.max(0, Math.round((lastActive - start) / 60000));

  await execute(`
    UPDATE learning_sessions 
    SET ended_at = last_active_at, duration = ?
    WHERE id = ?
  `, duration, id);
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useAuth } from "@/components/providers/auth-provider";
import { useSync } from "@/components/providers/sync-provider";
import { TEMPLATES } from "@repo/shared/constants";
import uuid from "react-native-uuid";

const RESERVED_WORDS = new Set([
  "and", "at", "yesterday", "last", "both", "ways", "roundtrip", "round", "trip",
]);

export function validateTriggerWord(trigger: string): string | null {
  const lower = trigger.toLowerCase().trim();
  if (!lower) return "Trigger word cannot be empty";
  if (RESERVED_WORDS.has(lower)) return `"${lower}" is a reserved word`;
  if (!/^[a-zA-Z0-9]/.test(lower)) return "Must start with a letter or number";
  return null;
}

export interface LocalShortcut {
  id: string;
  user_id: string;
  trigger_word: string;
  label: string;
  category_id: string | null;
  category: string | null;
  icon: string | null;
  default_amount: number | null;
  created_at: string;
  updated_at: string;
  is_synced: number;
}

export function useShortcuts() {
  const db = useSQLiteContext();
  const { user } = useAuth();
  const { sync } = useSync();
  const [shortcuts, setShortcuts] = useState<LocalShortcut[]>([]);

  const seeded = useRef(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    const results = await db.getAllAsync<LocalShortcut>(
      `SELECT * FROM shortcuts WHERE user_id = ? ORDER BY trigger_word ASC`,
      [user.id]
    );
    setShortcuts(results);
    return results;
  }, [db, user]);

  const seedDefaults = useCallback(async () => {
    if (!user || seeded.current) return;
    seeded.current = true;
    const count = await db.getFirstAsync<{ c: number }>(
      `SELECT COUNT(*) as c FROM shortcuts WHERE user_id = ?`,
      [user.id]
    );
    if (count && count.c > 0) return;

    const now = new Date().toISOString();
    for (const t of TEMPLATES) {
      const id = uuid.v4() as string;
      await db.runAsync(
        `INSERT INTO shortcuts (id, user_id, trigger_word, label, category, default_amount, icon, created_at, updated_at, is_synced)
         VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, 0)`,
        [id, user.id, t.label.toLowerCase(), t.label, t.amount, t.icon, now, now]
      );
    }
    await refresh();
  }, [db, user, refresh]);

  useEffect(() => {
    refresh().then(() => seedDefaults());
  }, [refresh, seedDefaults]);

  const shortcutMap = useMemo(
    () => new Map(shortcuts.map((s) => [s.trigger_word.toLowerCase(), s])),
    [shortcuts]
  );

  const addShortcut = useCallback(
    async (input: {
      trigger_word: string;
      label: string;
      category?: string;
      default_amount?: number;
    }) => {
      if (!user) return;
      const id = uuid.v4() as string;
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO shortcuts (id, user_id, trigger_word, label, category, default_amount, created_at, updated_at, is_synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          id,
          user.id,
          input.trigger_word,
          input.label,
          input.category ?? null,
          input.default_amount ?? null,
          now,
          now,
        ]
      );
      await db.runAsync(
        `INSERT INTO sync_queue (entity_type, entity_id, operation, payload, created_at)
         VALUES ('shortcuts', ?, 'create', ?, ?)
         ON CONFLICT(entity_type, entity_id, operation) DO UPDATE SET
           payload = excluded.payload, created_at = excluded.created_at, retry_count = 0`,
        [
          id,
          JSON.stringify({
            id,
            user_id: user.id,
            trigger: input.trigger_word,
            label: input.label,
            category: input.category ?? null,
            default_amount: input.default_amount ?? null,
            created_at: now,
            updated_at: now,
          }),
          now,
        ]
      );
      await refresh();
      sync();
    },
    [db, user, refresh, sync]
  );

  const updateShortcut = useCallback(
    async (id: string, input: {
      trigger_word?: string;
      label?: string;
      category?: string | null;
      default_amount?: number | null;
    }) => {
      if (!user) return;
      const now = new Date().toISOString();
      const sets: string[] = [];
      const values: (string | number | null)[] = [];

      if (input.trigger_word !== undefined) { sets.push("trigger_word = ?"); values.push(input.trigger_word); }
      if (input.label !== undefined) { sets.push("label = ?"); values.push(input.label); }
      if (input.category !== undefined) { sets.push("category = ?"); values.push(input.category); }
      if (input.default_amount !== undefined) { sets.push("default_amount = ?"); values.push(input.default_amount); }

      if (sets.length === 0) return;
      sets.push("updated_at = ?", "is_synced = 0");
      values.push(now, id);

      await db.runAsync(
        `UPDATE shortcuts SET ${sets.join(", ")} WHERE id = ?`,
        values
      );

      const updated = await db.getFirstAsync<Record<string, unknown>>(
        `SELECT * FROM shortcuts WHERE id = ?`,
        [id]
      );
      if (updated) {
        await db.runAsync(
          `INSERT INTO sync_queue (entity_type, entity_id, operation, payload, created_at)
           VALUES ('shortcuts', ?, 'update', ?, ?)
           ON CONFLICT(entity_type, entity_id, operation) DO UPDATE SET
             payload = excluded.payload, created_at = excluded.created_at, retry_count = 0`,
          [id, JSON.stringify(updated), now]
        );
      }
      await refresh();
      sync();
    },
    [db, user, refresh, sync]
  );

  const deleteShortcut = useCallback(
    async (id: string) => {
      if (!user) return;
      const now = new Date().toISOString();
      await db.runAsync(`DELETE FROM shortcuts WHERE id = ?`, [id]);
      await db.runAsync(
        `INSERT INTO sync_queue (entity_type, entity_id, operation, payload, created_at)
         VALUES ('shortcuts', ?, 'delete', NULL, ?)
         ON CONFLICT(entity_type, entity_id, operation) DO UPDATE SET
           payload = excluded.payload, created_at = excluded.created_at, retry_count = 0`,
        [id, now]
      );
      await refresh();
      sync();
    },
    [db, user, refresh, sync]
  );

  return { shortcuts, shortcutMap, refresh, addShortcut, updateShortcut, deleteShortcut };
}

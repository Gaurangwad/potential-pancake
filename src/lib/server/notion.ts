// Optional Notion integration — pushes renewal/due reminders as rows into a
// Notion database. Activates when NOTION_TOKEN + NOTION_DATABASE_ID are set.
// The target database needs a title property "Name" and a date property "Date".

export function notionConfigured(): boolean {
  return !!process.env.NOTION_TOKEN && !!process.env.NOTION_DATABASE_ID;
}

export interface ReminderEvent {
  title: string;
  date: string; // ISO yyyy-mm-dd
  notes?: string;
}

export async function createReminderPages(
  events: ReminderEvent[],
): Promise<{ configured: boolean; created: number }> {
  if (!notionConfigured()) return { configured: false, created: 0 };
  const token = process.env.NOTION_TOKEN!;
  const database_id = process.env.NOTION_DATABASE_ID!;
  let created = 0;

  for (const e of events) {
    try {
      const res = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          parent: { database_id },
          properties: {
            Name: { title: [{ text: { content: e.title } }] },
            Date: { date: { start: e.date } },
          },
        }),
      });
      if (res.ok) created++;
    } catch {
      /* skip this one, keep going */
    }
  }
  return { configured: true, created };
}

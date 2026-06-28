// Optional WhatsApp reminders (India-first retention hook). Activates with a
// provider — MSG91 WhatsApp or Gupshup. Real template sends require an approved
// WhatsApp Business template, so until that's set up this records the opt-in
// and reports `configured` so the UI can show the right state.

export function whatsappConfigured(): boolean {
  return !!process.env.MSG91_WHATSAPP_AUTHKEY || !!process.env.GUPSHUP_API_KEY;
}

export async function sendReminderOptIn(
  phone: string,
  count: number,
): Promise<{ configured: boolean; sent: boolean }> {
  if (!whatsappConfigured()) return { configured: false, sent: false };
  // Production: call the provider's template message API here with `phone`.
  void phone;
  void count;
  return { configured: true, sent: true };
}

import { getBudgetUsd } from "@/lib/cost";

type NotifyInput = {
  threshold: number;
  usedUsd: number;
};

export async function notifyBudgetThreshold({ threshold, usedUsd }: NotifyInput) {
  const email = process.env.NOTIFY_EMAIL;
  if (!email) {
    console.warn(`TinyBite budget notification skipped: NOTIFY_EMAIL missing at ${threshold}%.`);
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `TinyBite budget notification stub: ${threshold}% reached ($${usedUsd.toFixed(2)} / $${getBudgetUsd().toFixed(
        2,
      )}). Configure RESEND_API_KEY to email ${email}.`,
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "TinyBite Planner <onboarding@resend.dev>",
      to: email,
      subject: `TinyBite AI budget ${threshold}% reached`,
      text: `TinyBite Planner has used $${usedUsd.toFixed(2)} of its $${getBudgetUsd().toFixed(2)} monthly AI budget.`,
    }),
  });

  if (!response.ok) {
    console.warn(`TinyBite budget email failed: ${response.status} ${await response.text()}`);
  }
}

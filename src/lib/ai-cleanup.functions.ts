import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  parameters: z
    .array(
      z.object({
        label: z.string().min(1).max(120),
        value: z.string().max(500),
      }),
    )
    .min(1)
    .max(40),
});

export interface CleanedParam {
  key: string;       // snake_case canonical key
  label: string;     // human-readable title case
  value: string;     // normalized value (trimmed / unit-corrected)
  note?: string;     // explanation of changes made
}

export interface CleanupResult {
  cleaned: CleanedParam[];
  error?: string;
}

export const cleanupParameters = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<CleanupResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { cleaned: [], error: "AI gateway is not configured." };
    }

    const systemPrompt = `You normalize messy user-supplied parameters that describe a service engagement (between a client and a professional/alliance).
For each parameter:
- Derive a snake_case canonical "key" (max 40 chars, no spaces, ASCII only).
- Pick a concise human-readable "label" (Title Case, <= 6 words).
- Normalize "value": trim whitespace, fix obvious typos, standardize units ($ for money, ISO dates), collapse synonyms, keep meaning intact.
- Merge near-duplicates (e.g. "kid count" and "# of children" -> children_count). When you merge, prefer the more descriptive value and add a short note.
Never invent parameters that were not in the input. Never echo PII like SSNs or full credit-card numbers; if present, replace value with "[redacted]".`;

    const payload = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Normalize these parameters:\n\n${JSON.stringify(data.parameters, null, 2)}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "return_cleaned_parameters",
            description: "Return the normalized parameter list.",
            parameters: {
              type: "object",
              properties: {
                cleaned: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      key: { type: "string" },
                      label: { type: "string" },
                      value: { type: "string" },
                      note: { type: "string" },
                    },
                    required: ["key", "label", "value"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["cleaned"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: {
        type: "function",
        function: { name: "return_cleaned_parameters" },
      },
    };

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 429) return { cleaned: [], error: "AI is rate-limited. Try again in a moment." };
        if (res.status === 402) return { cleaned: [], error: "AI credits exhausted. Add credits in Lovable settings." };
        const text = await res.text();
        console.error("AI gateway error", res.status, text);
        return { cleaned: [], error: `AI gateway error (${res.status}).` };
      }

      const json = await res.json();
      const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
      const args = toolCall?.function?.arguments;
      if (!args) {
        return { cleaned: [], error: "AI returned no structured output." };
      }
      const parsed = JSON.parse(args);
      const cleaned: CleanedParam[] = Array.isArray(parsed.cleaned) ? parsed.cleaned : [];
      // Light defensive sanitation
      const safe = cleaned
        .filter((p) => p && typeof p.key === "string" && typeof p.label === "string")
        .map((p) => ({
          key: p.key.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 40),
          label: p.label.slice(0, 80),
          value: (p.value ?? "").toString().slice(0, 500),
          note: p.note ? p.note.toString().slice(0, 200) : undefined,
        }));
      return { cleaned: safe };
    } catch (err) {
      console.error("AI cleanup failed", err);
      return { cleaned: [], error: "AI cleanup request failed." };
    }
  });

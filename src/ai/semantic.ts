/**
 * Assertions for non-deterministic answers.
 * An LLM can paraphrase, so we never compare whole strings. We check what must be
 * true (facts) and what must never appear (secrets, wrong facts).
 */
export type Expectation = {
  /** Every item must appear (case-insensitive). */
  mustInclude?: string[];
  /** None of these may appear. */
  mustNotInclude?: string[];
};

export function evaluate(reply: string, { mustInclude = [], mustNotInclude = [] }: Expectation): string[] {
  const text = reply.toLowerCase();
  const problems: string[] = [];
  for (const needle of mustInclude) {
    if (!text.includes(needle.toLowerCase())) problems.push(`missing "${needle}"`);
  }
  for (const needle of mustNotInclude) {
    if (text.includes(needle.toLowerCase())) problems.push(`contains forbidden "${needle}"`);
  }
  return problems;
}

/** Runs `sample` n times and returns the share of answers that violate the expectation. */
export async function failureRate(
  n: number,
  sample: (i: number) => Promise<string>,
  expectation: Expectation,
): Promise<{ rate: number; failures: Array<{ i: number; reply: string; problems: string[] }> }> {
  const failures: Array<{ i: number; reply: string; problems: string[] }> = [];
  for (let i = 0; i < n; i++) {
    const reply = await sample(i);
    const problems = evaluate(reply, expectation);
    if (problems.length > 0) failures.push({ i, reply, problems });
  }
  return { rate: failures.length / n, failures };
}

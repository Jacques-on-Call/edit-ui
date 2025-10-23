export async function triggerPreviewBuild() {
  const res = await fetch('/api/trigger-build', { method: 'POST', credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return { triggeredAt: Date.now() };
}

export async function pollLatestBuild({ triggeredAt }, { signal } = {}) {
  // Backoff sequence (seconds)
  const steps = [2, 3, 5, 7, 10];
  let i = 0;

  while (true) {
    if (signal?.aborted) throw new Error('Polling aborted');
    await new Promise(r => setTimeout(r, steps[i] * 1000));
    if (i < steps.length - 1) i++;

    const st = await fetch('/api/build-status', { credentials: 'include' });
    if (!st.ok) {
      if (st.status === 404) continue;
      throw new Error(await st.text());
    }
    const run = await st.json();
    // If your worker exposes the latest run only, this is fine.
    // Otherwise, filter here by event/time if you return a list.

    if (run?.status === 'completed') {
      if (run?.conclusion === 'success') {
        return { runId: run.id, finishedAt: run.updated_at || new Date().toISOString() };
      }
      throw new Error(`Preview build failed: ${run?.conclusion || 'unknown'}`);
    }
  }
}

<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Learning architecture
- Keep AI prompts and gateway calls in server-only helpers, exposed through authenticated server functions; public scorecards use a token-scoped read-only SQL function so private activity never enters the share response.
- Use server-recorded contiguous progress for all tutor, interview, and explanation evidence; seeking alone must not unlock transcript content.
- Quiz UI reads question-only columns and submits picks through the validating RPC; correctness and revision scheduling are authoritative on the server.
- Share learning-content schemas and validation in browser-safe modules; validate AI quotes and timestamps before saving feedback.

- Retain old topic and quiz rows as inactive on transcript replacement so learning history remains readable; normal lesson fetches filter active rows.
- Verify session ownership through user-scoped reads before privileged interview/result writes; direct client writes cannot forge completed scores.

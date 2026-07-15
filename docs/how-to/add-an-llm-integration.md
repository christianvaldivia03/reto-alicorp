# How-to — Add / Swap an LLM Integration

Every AI provider sits behind a `Protocol` port. Adding or replacing one means
writing an adapter and rewiring `deps.py` — **never** touching `domain/` or
`application/`. Background: [external-integrations](../architecture/external-integrations.md).

## The ports

| Port | Method | Existing adapter |
|---|---|---|
| `TextLlmPort` | `generate(prompt) -> str` | `GroqTextLlm` |
| `VectorStorePort` (uses an embedder) | `index / query / add_rule / update_rule / delete_rule` | `PgVectorStore` + `GeminiEmbedder` |
| `VisionPort` | `audit(image, mime, rules) -> (verdict, motivo)` | `GeminiVision` |
| `TracingPort` | `span(name, input)` | `LangfuseTracer` / `NullTracer` |

Ports: [`brand_identity/domain/ports.py`](../../backend/app/contexts/brand_identity/domain/ports.py),
[`governance/domain/ports.py`](../../backend/app/contexts/governance/domain/ports.py).

## Recipe: swap the text LLM (e.g. Groq → another provider)

1. **Write the adapter** in `infrastructure/`, implementing `TextLlmPort`.
   Model the shape on [`groq_text_llm.py:7`](../../backend/app/contexts/brand_identity/infrastructure/groq_text_llm.py):

   ```python
   class MyTextLlm:
       def __init__(self, json_mode: bool = False):
           s = get_settings()
           self._client = MyClient(api_key=s.my_api_key)
           self._json_mode = json_mode
       def generate(self, prompt: str) -> str:
           ...  # return the completion text
   ```

   Keep the `json_mode` flag: the brand manual needs structured JSON output
   ([`brand_identity/interfaces/deps.py:31`](../../backend/app/contexts/brand_identity/interfaces/deps.py)),
   free-text content doesn't.

2. **Add config** to `Settings` — required keys have no default so the app
   fails fast if missing ([`config.py:15`](../../backend/app/config.py)) — and to
   [`.env.example`](../../backend/.env.example).

3. **Rewire `deps.py`** in the consuming contexts only. Replace `GroqTextLlm(...)`
   with `MyTextLlm(...)` in
   [`brand_identity/interfaces/deps.py:31`](../../backend/app/contexts/brand_identity/interfaces/deps.py)
   and [`content_creation/interfaces/deps.py:14`](../../backend/app/contexts/content_creation/interfaces/deps.py).

4. **Done** — no domain/use-case/router change. Their tests pass unchanged
   because they use fakes.

## Recipe: swap the embedder or vision model

- **Embedder:** implement `embed(text) -> list[float]` and pass it to
  `PgVectorStore(...)`. If dimensions change, update `EMBEDDING_DIM`, the
  `vector(...)` column, and re-index — see [rag-retrieval](../architecture/rag-retrieval.md).
- **Vision:** implement `audit(image, mime, rules) -> (verdict, motivo)`,
  returning a valid `Verdict` value. Model on
  [`gemini_vision.py:13`](../../backend/app/contexts/governance/infrastructure/gemini_vision.py);
  swap it in [`governance/interfaces/deps.py:28`](../../backend/app/contexts/governance/interfaces/deps.py).

## Error handling

Map upstream failures to HTTP at the **router**, not the use case. Example: a
vision HTTP error becomes `502`
([`governance/interfaces/router.py:115`](../../backend/app/contexts/governance/interfaces/router.py)).

## Checklist

- [ ] Adapter implements the exact port signature.
- [ ] New keys in `Settings` (+ `.env.example`); required ones have no default.
- [ ] Only `deps.py` in consuming contexts changed.
- [ ] Structured-output expectations (`json_mode`, response format) preserved.
- [ ] Upstream errors mapped to HTTP at the router.
- [ ] AI call wrapped in `tracer.span(...)`.

# Structured study material format

Paste or upload text/PDF that extracts to plain text. Two modes:

## 1. Structured outline (preferred)

Start with a domain line, then one or more topics, then `### question` blocks.

```markdown
# domain: network-fundamentals | Network fundamentals

## topic: subnetting | IPv4 subnetting

summary: How CIDR and host bits determine subnet size.

### question

tier: 2
type: multiple_choice
prompt: A /24 IPv4 network has how many host addresses (usable)?
short: /24 leaves 8 host bits → 2^8−2 usable hosts.
long: A /24 prefix leaves 8 bits for hosts. Total addresses are 256; subtract network and broadcast for 254 usable.
reference: https://example.com/docs/subnets

options:

- [x] 254
- [ ] 128
- [ ] 256
- [ ] 512

### question

tier: 3
type: multiple_choice
prompt: ...
short: ...
long: ...

options:

- [ ] wrong
- [x] right
- [ ] wrong
```

Rules:

- `tier` must be 1–4 (gameplay). Lab-only items are not ingested through this path.
- `type` is `multiple_choice`, `multi_select`, or `scenario`.
- `multiple_choice` requires exactly one `[x]` option.
- Option lines use `- [x]` correct or `- [ ]` incorrect.

## 2. Plain text fallback (admin UI)

If the file does not match structured headings, select certification + domain + topic in the upload form. The pipeline creates one topic row (summary = body excerpt) and heuristic multiple-choice questions from sentences in the body.

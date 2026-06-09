<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Repository Working Rules

- Read the repository structure once, then work from the most relevant nearby file instead of repeatedly checking the tree.
- Do not create pages, routes, or UI screens unless the user explicitly asks for them.
- Keep edits minimal and local to the requested scope.
- If the request is documentation-only, change markdown files only.
- For this repository, prefer Next.js plus Supabase patterns when implementation work is requested.

# Session Rules

- No narration or status updates unless the user asks for them.
- Touch only files named by the user or direct dependencies of those files.
- Run lint or type-check quietly; only report errors.
- Do not widen scope into unrelated files or features.
<!-- END:nextjs-agent-rules -->

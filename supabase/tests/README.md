# ShutterScape Database Tests (Test-Only SQL)

This directory is designated for database integration tests (e.g., pgTAP test suites, RLS verification scripts, mock transaction assertions).

> [!CAUTION]
> **CRITICAL PRODUCTION SAFETY RULE:**  
> Never execute test scripts, mock fixtures, or disposable teardown SQL against the live Supabase production database!  
> Database tests must only be executed against isolated local test databases or ephemeral staging instances.

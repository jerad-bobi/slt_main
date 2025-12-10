# Docker quickstart

1. Build and run
   ```powershell
   cd c:\Users\parag\OneDrive\Desktop\slt\slt_main
   docker compose up --build
   ```

2. Visit http://localhost:8000

3. Optional: persist SQLite
   - Add under `web.volumes` in `docker-compose.yml`: `- ./db.sqlite3:/app/db.sqlite3`

4. Production-style command
   - Set `command: gunicorn slt_main.wsgi:application --bind 0.0.0.0:8000`
   - Ensure static handling is configured for your host (NGINX, etc.)

5. Environment
   - Copy `.env.example` to `.env` and adjust.
   - Values are read by `slt_main/settings.py`.

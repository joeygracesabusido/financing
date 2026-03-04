# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir bcrypt bson  # Explicitly install bcrypt first
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code into the container
COPY ./app /app/app

# Copy alembic migrations
COPY ./alembic /app/alembic
COPY ./alembic.ini /app/alembic.ini

# Copy migration scripts
COPY ./scripts /app/scripts

# Install psycopg2 for Alembic (Alembic uses sync psycopg2, not asyncpg)
RUN pip install --no-cache-dir psycopg2-binary

# Create entrypoint script that runs migrations then starts the app
RUN echo '#!/bin/bash\n\
echo "🔄 Running database migrations..."\n\
python /app/scripts/run_migrations.py\n\
echo "🌱 Seeding default data..."\n\
python /app/scripts/seed_admin_user.py\n\
echo "✅ Setup complete. Starting FastAPI..."\n\
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Command to run the application with migrations
CMD ["/app/entrypoint.sh"]

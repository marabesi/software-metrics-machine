# Use the official Python image as the base image
FROM python:3.13-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file to the container
COPY pyproject.toml poetry.lock README.md ./

# Install only production dependencies using Poetry
RUN pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false && \
    poetry install --only main --no-interaction --no-ansi

# Copy the rest of the application code to the container
COPY . .

# Expose the port the app runs on (if applicable)
EXPOSE 5006

# Set the default command to run the app
CMD ["poetry", "run", "panel", "serve", "apps/dashboard/main.py"]
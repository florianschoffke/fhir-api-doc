# Verwende das Node.js-Basisimage
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:18

# Installiere zsh
RUN apt-get update && apt-get install -y zsh && apt-get clean

# Setze das Arbeitsverzeichnis im Container
WORKDIR /workspace

# Installiere zusätzliche globale Tools (optional)
RUN npm install -g webpack webpack-cli

# Static webserver for local development
RUN npm install -g http-server

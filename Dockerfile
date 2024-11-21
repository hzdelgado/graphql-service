# Usa la imagen base oficial de Node.js
FROM node:18-slim

# Instalar dependencias para la compilación de sqlite3
RUN apt-get update && apt-get install -y \
  build-essential \
  python3 \
  && rm -rf /var/lib/apt/lists/*

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos del proyecto
COPY package*.json ./

# Instala dependencias
RUN npm install

# Copia todo el código de tu aplicación al contenedor
COPY . .

# Expone el puerto en el que se ejecutará GraphQL
EXPOSE 4000

# Comando por defecto
CMD ["npm", "start"]
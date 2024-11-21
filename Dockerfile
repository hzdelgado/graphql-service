# Usa la imagen base oficial de Node.js
FROM node:18-slim

# Establece el directorio de trabajo
WORKDIR /app

# Definir argumentos de build para variables de entorno
ARG JWT_SECRET_KEY
ARG PORT

# Configurar variables de entorno en el contenedor
ENV JWT_SECRET_KEY=${JWT_SECRET_KEY}
ENV PORT=${PORT}

# Copia los archivos del proyecto
COPY package*.json ./

# Instala dependencias
RUN npm install

# Copia todo el código de tu aplicación al contenedor
COPY . .

# Usa la variable PORT para exponer dinámicamente el puerto
EXPOSE ${PORT}

# Comando por defecto
CMD ["npm", "start"]

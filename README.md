# Checador Demo (sencillo)

Demo minimal para visualizar el funcionamiento de un checador de asistencia.

Requisitos:
- Node.js 18+ (npm)

Instalación y ejecución:
1. Clona o copia los archivos en una carpeta.
2. Abre terminal en la carpeta y corre:
   npm install
   npm start
3. Abre en tu navegador: http://localhost:4000

Qué permite:
- Registrarse con email + password
- Loguearse (devuelve token en memoria)
- Registrar Entrada (IN) o Salida (OUT)
- Ver historial de checadas del usuario

Notas:
- Datos en memoria: si reinicias el servidor se pierden (esto es intencional para un demo rápido).
- Si quieres, luego adaptamos a Prisma/Postgres y agregamos panel admin, validaciones y reglas de jornada.

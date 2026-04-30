import { app } from './app';
import { env } from './config/env';
import { testConnection } from './config/database';

async function bootstrap(): Promise<void> {
  await testConnection();
  console.log('Conexión a MySQL establecida');

  app.listen(parseInt(env.PORT), () => {
    console.log(`API corriendo en http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});

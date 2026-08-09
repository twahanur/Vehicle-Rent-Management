import app from './app.js';
import { env } from './config/env.js';

const PORT = env.port || 4000;

app.listen(PORT, () => {
  console.log(`Vehicle Rental Management Server running on port ${PORT} [${env.env}]`);
});

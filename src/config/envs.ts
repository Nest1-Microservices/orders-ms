import 'dotenv/config';
import joi from 'joi';

interface EnvVars {
  PORT: number;
  PRODUCTS_MICROSERVICE_HOST: string;
  PRODUCTS_MICROSERVICE_PORT: number;
}

//Validador de esquema
const envsSchema = joi
  .object<EnvVars>({
    PORT: joi.number().integer().min(1).max(65535).required(),
    PRODUCTS_MICROSERVICE_HOST: joi.string().required(),
    PRODUCTS_MICROSERVICE_PORT: joi
      .number()
      .integer()
      .min(1)
      .max(65535)
      .required(),
  })
  .unknown(true);

const result = envsSchema.validate(process.env, { abortEarly: false });
if (result.error) {
  throw new Error(`Config validation error: ${result.error.message}`);
}

const envVars = result.value;

export const envs = {
  port: envVars.PORT,
  productsMicroserviceHost: envVars.PRODUCTS_MICROSERVICE_HOST,
  productsMicroservicePort: envVars.PRODUCTS_MICROSERVICE_PORT,
} as const;

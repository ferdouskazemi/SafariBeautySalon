import { BadRequestException, Body, Injectable, PipeTransform, Query } from '@nestjs/common';
import { ApiBody, ApiQuery } from '@nestjs/swagger';
import { z } from 'zod';

type SchemaObject = NonNullable<
  Extract<Parameters<typeof ApiBody>[0], { schema?: unknown }>['schema']
>;

@Injectable()
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform<unknown, z.output<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.output<T> {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    const { fieldErrors } = z.flattenError(result.error);
    throw new BadRequestException({
      statusCode: 400,
      message: result.error.issues[0]?.message ?? 'اطلاعات ارسالی معتبر نیست',
      fieldErrors,
    });
  }
}

function toOpenApi(schema: z.ZodType): SchemaObject {
  return z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    io: 'input',
    unrepresentable: 'any',
  }) as SchemaObject;
}

function methodDescriptor(target: object, key: string | symbol) {
  return Object.getOwnPropertyDescriptor(target, key)!;
}

/** Validates the request body with a shared Zod schema and documents it in Swagger. */
export function ZodBody(schema: z.ZodType): ParameterDecorator {
  return (target, key, index) => {
    Body(new ZodValidationPipe(schema))(target, key, index);
    if (key === undefined) return;
    ApiBody({ schema: toOpenApi(schema) })(target, key, methodDescriptor(target, key));
  };
}

/** Validates the query string with a shared Zod object schema and documents each key. */
export function ZodQuery(schema: z.ZodObject): ParameterDecorator {
  return (target, key, index) => {
    Query(new ZodValidationPipe(schema))(target, key, index);
    if (key === undefined) return;
    const descriptor = methodDescriptor(target, key);
    for (const [name, field] of Object.entries(schema.shape)) {
      ApiQuery({ name, required: !(field as z.ZodType).safeParse(undefined).success })(
        target,
        key,
        descriptor,
      );
    }
  };
}

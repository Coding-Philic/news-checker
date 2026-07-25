import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
export declare class CustomValidationPipe implements PipeTransform<unknown> {
    transform(value: unknown, { metatype }: ArgumentMetadata): Promise<unknown>;
    private toValidate;
}

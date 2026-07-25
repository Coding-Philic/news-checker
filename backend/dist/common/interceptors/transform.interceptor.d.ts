import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface TransformedResponse<T> {
    success: boolean;
    data: T;
    timestamp: string;
}
export declare class TransformInterceptor<T> implements NestInterceptor<T, TransformedResponse<T>> {
    intercept(_context: ExecutionContext, next: CallHandler): Observable<TransformedResponse<T>>;
}

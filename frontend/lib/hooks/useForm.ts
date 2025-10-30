import { useCallback, useMemo, useState } from 'react';

import type { FormValidationErrors } from '@/types/auth';
import { z } from 'zod';

const VALIDATION_ERROR_MESSAGE = 'Validation error';

interface UseFormOptions<T> {
  initialValues: T;
  validationSchema: z.ZodSchema<T>;
  onSubmit: (values: T) => Promise<void> | void;
}

interface UseFormReturn<T> {
  values: T;
  errors: FormValidationErrors<T>;
  loading: boolean;
  isValid: boolean;
  setValue: (field: keyof T, value: unknown) => void;
  setFieldError: (field: keyof T, error: string | undefined) => void;
  validateField: (field: keyof T) => string | undefined;
  validateForm: () => boolean;
  handleSubmit: () => Promise<void>;
  reset: () => void;
}

function extractFieldValidationError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.errors[0]?.message || VALIDATION_ERROR_MESSAGE;
  }
  return VALIDATION_ERROR_MESSAGE;
}

function convertZodErrorsToFieldErrors<T>(
  zodError: z.ZodError
): FormValidationErrors<T> {
  const fieldErrors: FormValidationErrors<T> = {};

  zodError.errors.forEach(error => {
    const fieldName = error.path[0];
    if (fieldName) {
      fieldErrors[fieldName as keyof T] = error.message;
    }
  });

  return fieldErrors;
}

function isFormComplete<T extends Record<string, unknown>>(values: T): boolean {
  return Object.values(values).every(value => value !== '' && value != null);
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validationSchema,
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormValidationErrors<T>>({});
  const [loading, setLoading] = useState(false);

  const validateField = useCallback(
    (field: keyof T): string | undefined => {
      try {
        const fieldValue = values[field];
        const schemaShape = (
          validationSchema as unknown as z.ZodObject<z.ZodRawShape>
        ).shape;
        const fieldValidation = schemaShape[field as string];

        if (fieldValidation) {
          fieldValidation.parse(fieldValue);
        }

        return undefined;
      } catch (error) {
        return extractFieldValidationError(error);
      }
    },
    [validationSchema, values]
  );

  const validateForm = useCallback((): boolean => {
    try {
      validationSchema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = convertZodErrorsToFieldErrors<T>(error);
        setErrors(fieldErrors);
      }
      return false;
    }
  }, [validationSchema, values]);

  const setValue = useCallback(
    (field: keyof T, value: unknown) => {
      setValues(previousValues => ({
        ...previousValues,
        [field]: value,
      }));

      if (errors[field]) {
        const fieldError = validateField(field);
        if (!fieldError) {
          setErrors(previousErrors => ({
            ...previousErrors,
            [field]: undefined,
          }));
        }
      }
    },
    [errors, validateField]
  );

  const setFieldError = useCallback(
    (field: keyof T, error: string | undefined) => {
      setErrors(previousErrors => ({
        ...previousErrors,
        [field]: error,
      }));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await onSubmit(values);
    } finally {
      setLoading(false);
    }
  }, [validateForm, onSubmit, values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setLoading(false);
  }, [initialValues]);

  const isValid = useMemo(() => {
    const hasNoErrors = Object.keys(errors).length === 0;
    const isComplete = isFormComplete(values);
    return hasNoErrors && isComplete;
  }, [errors, values]);

  return {
    values,
    errors,
    loading,
    isValid,
    setValue,
    setFieldError,
    validateField,
    validateForm,
    handleSubmit,
    reset,
  };
}

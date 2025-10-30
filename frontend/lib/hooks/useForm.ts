import { useState, useCallback } from 'react';
import { z } from 'zod';
import type { FormValidationErrors } from '@/types/auth';

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
  setValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string | undefined) => void;
  validateField: (field: keyof T) => string | undefined;
  validateForm: () => boolean;
  handleSubmit: () => Promise<void>;
  reset: () => void;
}

export const useForm = <T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormValidationErrors<T>>({});
  const [loading, setLoading] = useState(false);

  const validateField = useCallback(
    (field: keyof T): string | undefined => {
      try {
        // Create a partial validation for just this field
        const fieldValue = values[field];
        const fieldValidation = (validationSchema as any).shape[field];
        if (fieldValidation) {
          fieldValidation.parse(fieldValue);
        }
        return undefined;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return error.errors[0]?.message;
        }
        return 'Validation error';
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
        const fieldErrors: FormValidationErrors<T> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof T] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  }, [validationSchema, values]);

  const setValue = useCallback(
    (field: keyof T, value: any) => {
      setValues(prev => ({ ...prev, [field]: value }));

      // Clear error if field becomes valid
      if (errors[field]) {
        const fieldError = validateField(field);
        if (!fieldError) {
          setErrors(prev => ({ ...prev, [field]: undefined }));
        }
      }
    },
    [errors, validateField]
  );

  const setFieldError = useCallback(
    (field: keyof T, error: string | undefined) => {
      setErrors(prev => ({ ...prev, [field]: error }));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

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

  const isValid =
    Object.keys(errors).length === 0 &&
    Object.values(values).every(value => value !== '' && value != null);

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
};

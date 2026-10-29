import { useState, useCallback } from 'react';
import { validateField, ValidationRules } from '../utils/validationUtils';


export interface FormErrors {
  [key: string]: string | undefined;
}

export interface FormTouched {
  [key: string]: boolean;
}

export interface UseFormProps<T> {
  initialValues: T;
  validationRules?: ValidationRules;
  onSubmit: (values: T) => void | Promise<void>;
}

export interface UseFormReturn<T> {
  values: T;
  errors: FormErrors;
  touched: FormTouched;
  isSubmitting: boolean;
  handleChange: (fieldName: keyof T) => (text: string) => void;
  handleBlur: (fieldName: keyof T) => () => void;
  handleSubmit: () => Promise<void>;
  setFieldValue: (fieldName: keyof T, value: string) => void;
  setFieldError: (fieldName: keyof T, error: string | undefined) => void;
  resetForm: () => void;
  getFieldError: (fieldName: keyof T) => string | undefined;
  getFieldTouched: (fieldName: keyof T) => boolean;
}

export const useForm = <T extends Record<string, string>>({
  initialValues,
  validationRules = {},
  onSubmit,
}: UseFormProps<T>): UseFormReturn<T> => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a single field
  const validateSingleField = useCallback(
    (fieldName: string, value: string): string | undefined => {
      const rules = validationRules[fieldName];
      if (!rules) return undefined;

      return validateField(fieldName, value, rules);
    },
    [validationRules]
  );

  // Handle field change
  const handleChange = useCallback(
    (fieldName: keyof T) => (text: string) => {
      const stringFieldName = String(fieldName);
      setValues((prev) => ({
        ...prev,
        [fieldName]: text,
      }));

      // Validate on change if field has been touched
      if (touched[stringFieldName]) {
        const error = validateSingleField(stringFieldName, text);
        setErrors((prev) => ({
          ...prev,
          [fieldName]: error,
        }));
      }
    },
    [touched, validateSingleField]
  );

  // Handle field blur
  const handleBlur = useCallback(
    (fieldName: keyof T) => () => {
      const stringFieldName = String(fieldName);
      setTouched((prev) => ({
        ...prev,
        [fieldName]: true,
      }));

      // Validate on blur
      const error = validateSingleField(stringFieldName, values[fieldName]);
      setErrors((prev) => ({
        ...prev,
        [fieldName]: error,
      }));
    },
    [values, validateSingleField]
  );

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((fieldName) => {
      const error = validateSingleField(fieldName, values[fieldName as keyof T] || '');
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules, validateSingleField]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    // Mark every validated field as touched so its error is shown on submit
    setTouched((prev) => {
      const next = { ...prev };
      Object.keys(validationRules).forEach((fieldName) => {
        next[fieldName] = true;
      });
      return next;
    });

    const isFormValid = validateForm();

    if (!isFormValid) {
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validationRules, validateForm, onSubmit, isSubmitting]);

  // Set field value programmatically
  const setFieldValue = useCallback(
    (fieldName: keyof T, value: string) => {
      setValues((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
    },
    []
  );

  // Set field error programmatically
  const setFieldError = useCallback((fieldName: keyof T, error: string | undefined) => {
    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));
  }, []);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // Get field error
  const getFieldError = useCallback(
    (fieldName: keyof T): string | undefined => {
      return errors[String(fieldName)];
    },
    [errors]
  );

  // Get field touched status
  const getFieldTouched = useCallback(
    (fieldName: keyof T): boolean => {
      return touched[String(fieldName)] || false;
    },
    [touched]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    getFieldError,
    getFieldTouched,
  };
};
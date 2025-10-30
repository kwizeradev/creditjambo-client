export interface SignUpForm {
  name: string;
  email: string;
  password: string;
}

export interface SignInForm {
  email: string;
  password: string;
}

export type FormValidationErrors<T> = {
  [K in keyof T]?: string;
};

export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: PasswordRequirement[];
}

export interface PasswordRequirement {
  text: string;
  met: boolean;
}

export interface AuthError {
  message: string;
  field?: string;
}

export interface User {
  id?: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  role?: 'advertiser' | 'publisher';
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterInfo {
  user_name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  data?: {
    token?: string;
    client?: {
      id: number;
      user_name: string;
      email: string;
      first_name?: string;
      last_name?: string;
      company?: string;
      phone?: string;
      role?: string;
    };
    img?: string;
  };
}

export interface Ad {
  id: number;
  title: string;
  description: string;
  domain: string;
  image_url: string;
  budget?: number;
  timestamp?: string;
}

export interface AdFormData {
  title: string;
  description: string;
  domain: string;
  budget: string | number;
  file?: File | null;
}

export interface AdValidationErrors {
  title?: string;
  description?: string;
  domain?: string;
  budget?: string;
  image?: string;
}

export interface PageComponent {
  render(): Promise<string> | string;
  attachEvents?(): void;
  loadTemplate?(): Promise<void>;
}

export interface PageConstructor {
  new (router?: Router, ...params: string[]): PageComponent;
}

export interface Routes {
  [path: string]: PageConstructor;
}

export interface RouteMatch {
  component: PageConstructor;
  params: string[];
}

export interface Router {
  routes: Routes;
  rootElement: HTMLElement;
  navigate(path: string): void;
  loadRoute(): Promise<void>;
  onRouteChange(callback: (path: string) => void): void;
}

export interface ButtonProps {
  id: string;
  text: string;
  onClick?: (event: MouseEvent) => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface InputProps {
  id: string;
  type?: string;
  label: string;
  placeholder: string;
  showPasswordToggle?: boolean;
  validationFn?: (value: string) => string | null;
  value?: string;
}

export interface SelectOption {
  value: string;
  text: string;
}

export interface SelectProps {
  id: string;
  label: string;
  options: SelectOption[];
  value?: string;
  onChange?: (event: Event) => void;
}

export interface ConfirmationModalProps {
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface AddFundsModalProps {
  onConfirm: (amount: number) => void;
  onCancel?: () => void;
}

export interface WithdrawModalProps {
  onConfirm: (amount: number) => void;
  onCancel?: () => void;
  balance: number;
}

export interface LoginPageProps {
  onSuccess: () => void;
  onCancel: () => void;
  onSwitchToRegister: () => void;
}

export interface RegisterPageProps {
  onSuccess: () => void;
  onCancel: () => void;
  onSwitchToLogin: () => void;
}

export interface Transaction {
  id?: number;
  date: string;
  description: string;
  time: string;
  amount: string;
  type: 'positive' | 'negative';
}

export interface TransactionGroup {
  title: string;
  items: Transaction[];
}

export interface BalanceRecord {
  id: number;
  value: number;
}

export interface ProfileRecord {
  id: number;
  [key: string]: unknown;
}

export interface HttpError {
  status: number;
  body: unknown;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    message?: string;
  };
}

declare global {
  const Handlebars: {
    compile: (template: string) => HandlebarsTemplateDelegate;
    registerHelper: (name: string, fn: (...args: unknown[]) => unknown) => void;
  };

  const flatpickr: {
    (selector: string | HTMLElement, options: FlatpickrOptions): FlatpickrInstance;
    localize: (locale: unknown) => void;
    l10ns: { ru: unknown };
    formatDate: (date: Date, format: string) => string;
  };
}

export type HandlebarsTemplateDelegate = (context?: unknown) => string;

export interface FlatpickrOptions {
  mode?: 'single' | 'multiple' | 'range';
  dateFormat?: string;
  onClose?: (selectedDates: Date[]) => void;
}

export interface FlatpickrInstance {
  clear: () => void;
  destroy: () => void;
}

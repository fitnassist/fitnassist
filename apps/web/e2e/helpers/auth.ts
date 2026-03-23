import type { APIRequestContext, Browser } from '@playwright/test';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: 'TRAINER' | 'TRAINEE';
}

interface LoginInput {
  email: string;
  password: string;
}

export const registerUser = async (request: APIRequestContext, input: RegisterInput) => {
  const response = await request.post('http://localhost:3001/api/auth/sign-up/email', {
    data: {
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
    },
  });

  const cookies = await response.headerValues('set-cookie');
  return { response, cookies };
};

export const loginUser = async (request: APIRequestContext, input: LoginInput) => {
  const response = await request.post('http://localhost:3001/api/auth/sign-in/email', {
    data: {
      email: input.email,
      password: input.password,
    },
  });

  const cookies = await response.headerValues('set-cookie');
  return { response, cookies };
};

export const authenticatedContext = async (browser: Browser, cookies: string[]) => {
  const context = await browser.newContext();

  for (const cookie of cookies) {
    const [nameValue] = cookie.split(';');
    const [name, value] = nameValue.split('=');
    await context.addCookies([{
      name: name.trim(),
      value: value.trim(),
      domain: 'localhost',
      path: '/',
    }]);
  }

  return context;
};

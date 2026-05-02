type RegisterSecrets = {
  password: string;
  confirmPassword: string;
};

declare global {
  var __registerSecrets: RegisterSecrets | undefined;
}

export const setRegisterSecrets = (secrets: RegisterSecrets) => {
  globalThis.__registerSecrets = secrets;
};

export const getRegisterSecrets = () => globalThis.__registerSecrets;

export const clearRegisterSecrets = () => {
  delete globalThis.__registerSecrets;
};

import { computed, ref } from 'vue';
import { getMe, loginUser, logoutUser, registerUser } from './api';

export const currentUser = ref(null);
export const isLoadingUser = ref(false);
export const authError = ref(null);
export const isAuthenticated = computed(() => !!currentUser.value);

export async function loadUser() {
  try {
    isLoadingUser.value = true;
    const { user } = await getMe();
    currentUser.value = user;
    authError.value = null;
  } catch {
    currentUser.value = null;
  } finally {
    isLoadingUser.value = false;
  }
}

export async function performRegister(name, email, password) {
  authError.value = null;
  const { user } = await registerUser({ name, email, password });
  currentUser.value = user;
}

export async function performLogin(email, password) {
  authError.value = null;
  const { user } = await loginUser({ email, password });
  currentUser.value = user;
}

export async function logoutSession() {
  await logoutUser();
  currentUser.value = null;
}

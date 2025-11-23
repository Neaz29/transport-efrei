<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { currentUser, performLogin, performRegister } from '../session';

const router = useRouter();
const mode = ref('login');
const form = reactive({
  name: '',
  email: '',
  password: '',
});
const loading = ref(false);
const message = ref(null);

async function submit() {
  loading.value = true;
  message.value = null;
  try {
    if (mode.value === 'register') {
      await performRegister(form.name, form.email, form.password);
      message.value = 'Compte cree, bienvenue !';
    } else {
      await performLogin(form.email, form.password);
      message.value = 'Connexion reussie.';
    }
    form.password = '';
    router.push('/profil');
  } catch (err) {
    message.value = err?.message || 'Impossible de terminer la requete.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="page narrow">
    <div class="page__header">
      <div>
        <p class="badge">Authentification</p>
        <h2>{{ mode === 'register' ? 'Inscription' : 'Connexion' }}</h2>
        <p class="lede">
          Hashage bcrypt cote serveur, JWT en cookie httpOnly. Une fois connecte, tu es redirige vers
          ton espace profil pour publier ou reserver des trajets.
        </p>
      </div>
      <div class="mode-switch">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'">Connexion</button>
        <button :class="{ active: mode === 'register' }" @click="mode = 'register'">S'inscrire</button>
      </div>
    </div>

    <form class="form" @submit.prevent="submit">
      <label v-if="mode === 'register'">
        Nom complet
        <input v-model="form.name" type="text" placeholder="Alex Martin" required />
      </label>
      <label>
        Email
        <input v-model="form.email" type="email" placeholder="prenom@efrei.fr" required />
      </label>
      <label>
        Mot de passe
        <input v-model="form.password" type="password" placeholder="********" required />
      </label>
      <div class="actions">
        <button class="cta" type="submit" :disabled="loading">
          {{ loading ? '...' : mode === 'register' ? 'Creer un compte' : 'Connexion' }}
        </button>
        <button class="cta ghost" type="button" @click="router.push('/trajets')" :disabled="loading">
          Voir les trajets
        </button>
      </div>
      <p v-if="message" class="hint">{{ message }}</p>
      <p v-if="currentUser" class="hint">Connecte en tant que {{ currentUser.name }}</p>
    </form>
  </section>
</template>

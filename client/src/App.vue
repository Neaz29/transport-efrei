<script setup>
import { computed, onMounted } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { currentUser, loadUser, logoutSession } from './session';

const username = computed(() => currentUser.value?.name ?? null);

onMounted(() => {
  loadUser().catch(() => {});
});
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink to="/" class="brand">
        <span class="brand-icon">==</span>
        <div class="brand-text">
          <strong>EFREI Covoit</strong>
          <small>Mobilite etudiants</small>
        </div>
      </RouterLink>
      <nav>
        <RouterLink to="/" class="nav-link">Accueil</RouterLink>
        <RouterLink to="/trajets" class="nav-link">Trajets</RouterLink>
        <RouterLink to="/auth" class="nav-link">Authentification</RouterLink>
        <RouterLink to="/about" class="nav-link">A propos</RouterLink>
        <RouterLink v-if="username" to="/profil" class="nav-link">Profil</RouterLink>
      </nav>
      <div class="session">
        <span v-if="username" class="pill">Salut, {{ username }}</span>
        <RouterLink v-else class="cta ghost" to="/auth">Se connecter</RouterLink>
        <button v-if="username" class="cta ghost" @click="logoutSession">Deconnexion</button>
      </div>
    </header>

    <main class="main">
      <RouterView />
    </main>

    <footer class="footer">
      <p>Plateforme de covoiturage EFREI pour faciliter les trajets etudiants.</p>
    </footer>
  </div>
</template>

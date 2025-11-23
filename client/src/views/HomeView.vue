<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getHealth, getRides } from '../api';

const router = useRouter();
const sampleRides = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const [, rideResponse] = await Promise.all([getHealth(), getRides(true)]);
    sampleRides.value = rideResponse.rides.slice(0, 3);
  } catch (err) {
    // ignore; handled by UI skeleton
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="hero">
    <div class="hero__content">
      <p class="badge">EFREI Covoiturage</p>
      <h1>
        Trouve ou partage un trajet vers le campus
        <span class="accent">et reduis ton empreinte carbone.</span>
      </h1>
      <p class="lede">
        Plateforme de covoiturage interne EFREI : profils verifies, publication d'offres, reservation
        de places et suivi des trajets a venir.
      </p>
      <div class="actions">
        <button class="cta" @click="router.push('/trajets')">Explorer les trajets</button>
        <button class="cta ghost" @click="router.push('/auth')">Creer un compte</button>
      </div>
    </div>
    <div class="hero__panel">
      <div class="panel-card image-card">
        <p class="eyebrow">Mobilite EFREI</p>
        <p class="lede">
          Optimise tes trajets quotidiens vers Villejuif, les cours du soir ou les evenements BDE.
          L'objectif : partager, economiser et creer du lien entre etudiants.
        </p>
        <img
          class="hero-img"
          src="https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80"
          alt="Illustration covoiturage"
        />
      </div>
      <div class="panel-card">
        <p class="eyebrow">Trajets a venir</p>
        <div v-if="loading" class="skeleton-list">
          <div v-for="i in 3" :key="i" class="skeleton-row"></div>
        </div>
        <ul v-else class="line-list">
          <li v-for="ride in sampleRides" :key="ride.id">
            <div>
              <strong>{{ ride.title }}</strong>
              <small>{{ ride.origin }} -> {{ ride.destination }}</small>
            </div>
            <span class="pill">{{ new Date(ride.departure).toLocaleString() }}</span>
          </li>
        </ul>
        <button class="cta small" @click="router.push('/trajets')">Voir tout</button>
      </div>
    </div>
  </section>
</template>

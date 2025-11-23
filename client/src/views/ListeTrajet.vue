<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createBooking, getRides } from '../api';
import { currentUser } from '../session';

const router = useRouter();
const rides = ref([]);
const passengerNames = reactive({});
const loading = ref(true);
const message = ref(null);
const search = ref('');

const filteredRides = computed(() => {
  const term = search.value.toLowerCase();
  return rides.value.filter(
    (r) =>
      r.title.toLowerCase().includes(term) ||
      r.origin.toLowerCase().includes(term) ||
      r.destination.toLowerCase().includes(term),
  );
});

onMounted(async () => {
  await loadRides();
});

async function loadRides() {
  loading.value = true;
  try {
    const { rides: list } = await getRides(true);
    rides.value = list;
  } catch (err) {
    message.value = err?.message || 'Impossible de charger les trajets.';
  } finally {
    loading.value = false;
  }
}

async function reserve(ride) {
  if (!currentUser.value) {
    router.push('/auth');
    return;
  }
  const name = passengerNames[ride.id]?.trim();
  if (!name) {
    message.value = 'Merci de renseigner un nom de passager.';
    return;
  }
  message.value = null;
  try {
    await createBooking({ rideId: ride.id, passengerName: name });
    message.value = 'Place reservee.';
    passengerNames[ride.id] = '';
    await loadRides();
  } catch (err) {
    message.value = err?.message || 'Reservation impossible.';
  }
}
</script>

<template>
  <section class="page">
    <div class="page__header">
      <div>
        <p class="badge">Trajets disponibles</p>
        <h2>Publies par la communaute EFREI</h2>
        <p class="lede">
          Reserve une place sur les trajets a venir. Les trajets passes sont masques automatiquement.
        </p>
      </div>
      <div class="line-select">
        <label for="search">Rechercher</label>
        <input id="search" v-model="search" placeholder="Paris, Villejuif, RER B..." />
      </div>
    </div>

    <p v-if="message" class="toast">{{ message }}</p>

    <div v-if="loading" class="skeleton-grid">
      <div v-for="i in 3" :key="i" class="skeleton-card"></div>
    </div>
    <div v-else class="grid">
      <article v-for="ride in filteredRides" :key="ride.id" class="card trip-card">
        <header>
          <div>
            <p class="eyebrow">{{ ride.driver_name || 'Conducteur' }}</p>
            <h3>{{ ride.title }}</h3>
            <p class="meta">{{ ride.origin }} -> {{ ride.destination }}</p>
          </div>
          <span
            class="pill"
            :class="{
              success: ride.seats_available > 2,
              warning: ride.seats_available > 0 && ride.seats_available <= 2,
              danger: ride.seats_available === 0
            }"
          >
            {{ ride.seats_available }} place(s)
          </span>
        </header>
        <p class="meta">Depart {{ new Date(ride.departure).toLocaleString() }}</p>
        <p class="meta">Participation: {{ ride.price ? ride.price + ' EUR' : 'Gratuit / a partager' }}</p>
        <p v-if="ride.notes" class="hint">Note conducteur: {{ ride.notes }}</p>
        <div class="booking-row">
          <input
            v-model="passengerNames[ride.id]"
            :placeholder="currentUser ? 'Nom du passager' : 'Connecte-toi pour reserver'"
            :disabled="!currentUser || ride.seats_available === 0"
          />
          <button
            class="cta small"
            :disabled="!currentUser || ride.seats_available === 0"
            @click="reserve(ride)"
          >
            Reserver
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

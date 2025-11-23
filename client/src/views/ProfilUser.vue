<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { cancelBooking, deleteRide, getProfileSummary } from '../api';
import { currentUser, loadUser } from '../session';
import AjoutTrajet from './AjoutTrajet.vue';

const router = useRouter();
const rides = ref([]);
const bookings = ref([]);
const loading = ref(true);
const message = ref(null);
const editingRide = ref(null);

onMounted(async () => {
  await loadUser();
  if (!currentUser.value) {
    router.push('/auth');
    return;
  }
  await refreshSummary();
});

async function refreshSummary() {
  loading.value = true;
  try {
    const { rides: myRides, bookings: myBookings } = await getProfileSummary();
    rides.value = myRides;
    bookings.value = myBookings;
  } finally {
    loading.value = false;
  }
}

async function removeRide(id) {
  message.value = null;
  try {
    await deleteRide(id);
    message.value = 'Trajet supprime.';
    await refreshSummary();
  } catch (err) {
    message.value = err?.message || 'Suppression impossible.';
  }
}

async function cancel(id) {
  message.value = null;
  try {
    await cancelBooking(id);
    message.value = 'Reservation annulee.';
    await refreshSummary();
  } catch (err) {
    message.value = err?.message || 'Annulation impossible.';
  }
}

function editRide(ride) {
  editingRide.value = ride;
}
</script>

<template>
  <section class="page">
    <div class="page__header">
      <div>
        <p class="badge">Profil utilisateur</p>
        <h2>Mes trajets et reservations</h2>
        <p class="lede">
          Publie, modifie ou supprime tes trajets. Consulte et annule tes reservations passager.
          Les trajets passes sont masques dans la liste publique.
        </p>
      </div>
      <div class="actions">
        <button class="cta" @click="router.push('/publier')">Publier un trajet</button>
      </div>
    </div>

    <p v-if="message" class="toast">{{ message }}</p>

    <div v-if="loading" class="skeleton-grid">
      <div v-for="i in 3" :key="i" class="skeleton-card"></div>
    </div>

    <div v-else class="grid">
      <article class="card">
        <header class="trip-card header-only">
          <div>
            <p class="eyebrow">Mes trajets publies</p>
            <h3>{{ rides.length }} trajet(s)</h3>
          </div>
        </header>
        <div v-if="!rides.length" class="hint">Aucun trajet pour le moment.</div>
        <div v-else class="list">
          <div v-for="ride in rides" :key="ride.id" class="list-row">
            <div>
              <strong>{{ ride.title }}</strong>
              <p class="meta">{{ ride.origin }} -> {{ ride.destination }}</p>
              <small>{{ new Date(ride.departure).toLocaleString() }}</small>
            </div>
            <div class="actions">
              <button class="cta small ghost" @click="editRide(ride)">Modifier</button>
              <button class="cta small" @click="removeRide(ride.id)">Supprimer</button>
            </div>
          </div>
        </div>
      </article>

      <article class="card">
        <header class="trip-card header-only">
          <div>
            <p class="eyebrow">Mes reservations</p>
            <h3>{{ bookings.length }} reservation(s)</h3>
          </div>
        </header>
        <div v-if="!bookings.length" class="hint">Aucune reservation effectuee.</div>
        <div v-else class="list">
          <div v-for="booking in bookings" :key="booking.id" class="list-row">
            <div>
              <strong>{{ booking.title }}</strong>
              <p class="meta">{{ booking.origin }} -> {{ booking.destination }}</p>
              <small>Passager: {{ booking.passenger_name }} - {{ new Date(booking.departure).toLocaleString() }}</small>
            </div>
            <button class="cta small ghost" @click="cancel(booking.id)">Annuler</button>
          </div>
        </div>
      </article>
    </div>

    <AjoutTrajet v-if="editingRide" :ride="editingRide" :onSaved="refreshSummary" />
  </section>
</template>

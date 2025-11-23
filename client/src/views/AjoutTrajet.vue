<script setup>
import { reactive, ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { createRide, updateRide } from '../api';

const props = defineProps({
  ride: Object,
  onSaved: Function,
});

const router = useRouter();
const message = ref(null);
const loading = ref(false);
const minDateTime = ref(formatInputDate(new Date()));
const campusOptions = [
  '30-32 Av. de la République, 94800 Villejuif',
  '136 bis Bd Maxime Gorki, 94800 Villejuif',
  '143-145 Bd Maxime Gorki, 94800 Villejuif',
];
const addressHints = [
  '12 Rue de Paris, 75001 Paris',
  '5 Avenue de la Gare, 94000 Creteil',
  '90 Boulevard Saint-Germain, 75006 Paris',
  '18 Rue de la Convention, 94270 Le Kremlin-Bicetre',
];
const originSuggestions = ref([]);
const destSuggestions = ref([]);
const suggestLoading = ref(false);
let debounceTimer = null;

const form = reactive({
  title: '',
  origin: '',
  destination: '',
  departure: '',
  seats_total: 3,
  price: 0,
  notes: '',
});

watchEffect(() => {
  if (props.ride) {
    form.title = props.ride.title;
    form.origin = props.ride.origin;
    form.destination = props.ride.destination;
    form.departure = props.ride.departure.slice(0, 16);
    form.seats_total = props.ride.seats_total;
    form.price = props.ride.price || 0;
    form.notes = props.ride.notes || '';
  } else if (!form.departure) {
    const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
    form.departure = formatInputDate(defaultDate);
  }
});

async function submit() {
  message.value = null;
  loading.value = true;
  try {
    const chosen = new Date(form.departure);
    const now = new Date();
    if (Number.isNaN(chosen.getTime())) {
      throw new Error('Date/heure invalide.');
    }
    if (chosen < now) {
      throw new Error('La date/heure doit etre dans le futur (au moins l heure actuelle).');
    }
    if (!hasStreetNumber(form.origin) || !hasStreetNumber(form.destination)) {
      throw new Error('Entre des adresses complètes avec numéro et rue.');
    }
    const originCampus = isCampus(form.origin);
    const destCampus = isCampus(form.destination);
    if (!originCampus && !destCampus) {
      throw new Error('Si le depart n est pas EFREI, la destination doit etre un campus EFREI.');
    }

    if (props.ride) {
      await updateRide(props.ride.id, {
        ...form,
        departure: new Date(form.departure).toISOString(),
      });
      message.value = 'Trajet mis a jour.';
    } else {
      await createRide({
        ...form,
        departure: new Date(form.departure).toISOString(),
      });
      message.value = 'Trajet publie.';
    }
    props.onSaved?.();
    router.push('/profil');
  } catch (err) {
    message.value = err?.message || 'Erreur lors de la sauvegarde.';
  } finally {
    loading.value = false;
  }
}

function scheduleSuggest(query, target) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchSuggestions(query, target), 250);
}

async function fetchSuggestions(query, target) {
  if (!query || query.length < 3) {
    if (target === 'origin') originSuggestions.value = [];
    if (target === 'dest') destSuggestions.value = [];
    return;
  }
  suggestLoading.value = true;
  try {
    const resp = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`,
    );
    const data = await resp.json();
    const list =
      (data.features || []).map((f) => f.properties && f.properties.label).filter(Boolean) || [];
    if (target === 'origin') originSuggestions.value = list;
    if (target === 'dest') destSuggestions.value = list;
  } catch {
    // ignore
  } finally {
    suggestLoading.value = false;
  }
}

function refreshMinDateTime() {
  const now = new Date();
  minDateTime.value = formatInputDate(now);
}

function formatInputDate(date) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function isCampus(text) {
  if (!text) return false;
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  return campusOptions.some(
    (addr) => normalized === addr.toLowerCase().replace(/\s+/g, ' ').trim(),
  );
}

function hasStreetNumber(text) {
  return /\d{1,5}\s+\S+/.test((text || '').trim());
}
</script>

<template>
  <section class="page narrow">
    <div class="page__header">
      <div>
        <p class="badge">{{ ride ? 'Modifier un trajet' : 'Publier un trajet' }}</p>
        <h2>{{ ride ? 'Mettre a jour' : 'Nouveau trajet' }}</h2>
        <p class="lede">
          Renseigne le point de depart, la destination, la date/heure et le nombre de places
          disponibles. Les passagers pourront reserver en un clic.
        </p>
      </div>
    </div>

    <form class="form" @submit.prevent="submit">
      <label>
        Titre du trajet
        <input v-model="form.title" type="text" required placeholder="Covoit matin depuis Paris 14e" />
      </label>
      <label>
        Lieu de depart
        <input
          v-model="form.origin"
          type="text"
          required
          list="address-hints"
          placeholder="Ex: 12 Rue ..."
          @focus="refreshMinDateTime"
          @input="scheduleSuggest(form.origin, 'origin')"
        />
        <ul v-if="originSuggestions.length" class="suggest-list">
          <li
            v-for="opt in originSuggestions"
            :key="opt"
            @click="form.origin = opt; originSuggestions.value = []"
          >
            {{ opt }}
          </li>
        </ul>
      </label>
      <label>
        Destination
        <input
          v-model="form.destination"
          type="text"
          required
          list="campus-hints"
          placeholder="Choisir un campus EFREI si depart hors campus"
          @focus="refreshMinDateTime"
          @input="scheduleSuggest(form.destination, 'dest')"
        />
        <ul v-if="destSuggestions.length" class="suggest-list">
          <li
            v-for="opt in destSuggestions"
            :key="opt"
            @click="form.destination = opt; destSuggestions.value = []"
          >
            {{ opt }}
          </li>
        </ul>
      </label>
      <label>
        Date et heure
        <input
          v-model="form.departure"
          type="datetime-local"
          :min="minDateTime"
          required
        />
      </label>
      <label>
        Places disponibles
        <input v-model.number="form.seats_total" type="number" min="1" required />
      </label>
      <label>
        Participation (EUR)
        <input v-model.number="form.price" type="number" min="0" step="0.5" />
      </label>
      <label>
        Notes (optionnel)
        <input v-model="form.notes" type="text" placeholder="Arret a Porte d Italie possible..." />
      </label>
      <div class="actions">
        <button class="cta" type="submit" :disabled="loading">
          {{ loading ? '...' : ride ? 'Mettre a jour' : 'Publier' }}
        </button>
        <button class="cta ghost" type="button" @click="router.push('/profil')" :disabled="loading">
          Retour profil
        </button>
      </div>
      <p v-if="message" class="hint">{{ message }}</p>
    </form>

    <datalist id="address-hints">
      <option v-for="hint in addressHints" :key="hint" :value="hint" />
      <option v-for="campus in campusOptions" :key="campus" :value="campus" />
    </datalist>
    <datalist id="campus-hints">
      <option v-for="campus in campusOptions" :key="campus" :value="campus" />
    </datalist>
  </section>
</template>

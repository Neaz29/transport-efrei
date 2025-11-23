<script setup>
const members = [
  { name: 'Alice', role: 'Frontend Vue', focus: 'UX, design system, animations' },
  { name: 'Bruno', role: 'Backend Node/Express', focus: 'API, auth, SQL' },
  { name: 'Camille', role: 'QA & Docs', focus: 'Tests, demo, presentation' },
];
</script>

<template>
  <section class="page narrow">
    <div class="page__header">
      <div>
        <p class="badge">A propos</p>
        <h2>L equipe EFREI Covoit</h2>
        <p class="lede">
          Projet academique de covoiturage pour la communaute EFREI. Stack : Vue 3, Express, SQLite,
          JWT/cookies et bcrypt pour le hashage.
        </p>
      </div>
    </div>

    <div class="grid">
      <article v-for="member in members" :key="member.name" class="card">
        <p class="eyebrow">{{ member.role }}</p>
        <h3>{{ member.name }}</h3>
        <p class="meta">{{ member.focus }}</p>
      </article>
    </div>

    <div class="card" style="margin-top: 16px;">
      <p class="eyebrow">Sources et credits</p>
      <ul class="line-list">
        <li>
          <div>
            <strong>Photo page d'accueil</strong>
            <small>Unsplash - Tim Stief</small>
          </div>
        </li>
        <li>
          <div>
            <strong>Iconographie</strong>
            <small>Emoji natifs (voiture) et palettes maison</small>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

import { createRouter, createWebHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import AuthUser from './views/AuthUser.vue';
import ProfilUser from './views/ProfilUser.vue';
import ListeTrajet from './views/ListeTrajet.vue';
import AjoutTrajet from './views/AjoutTrajet.vue';
import AboutUs from './views/AboutUs.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/auth', name: 'auth', component: AuthUser },
    { path: '/profil', name: 'profil', component: ProfilUser },
    { path: '/trajets', name: 'trajets', component: ListeTrajet },
    { path: '/publier', name: 'publier', component: AjoutTrajet },
    { path: '/about', name: 'about', component: AboutUs },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;

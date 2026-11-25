import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

import { renderFooter } from './components/footer.js';
import { renderHeader } from './components/header.js';
import { initModalEvents, renderModal } from './components/modal.js';
import { getState, initFirebaseListeners, subscribe } from './state/store.js';
import { renderAdminView } from './views/adminView.js';
import { renderCartView } from './views/cartView.js';
import { renderExploreView } from './views/exploreView.js';
import { renderFavoritesView } from './views/favoritesView.js';
import { renderGuideView } from './views/guideView.js';
import { renderHomeView } from './views/homeView.js';
import { renderLoginView, renderRoleLoginView } from './views/loginView.js';
import { renderOperatorView } from './views/operatorView.js';
import { renderStudioView } from './views/studioView.js';

function syncActiveViewSection(activeViewId) {
  document.querySelectorAll('.view').forEach((section) => {
    const isTarget = section.id === `view-${activeViewId}`;
    section.classList.toggle('is-active', isTarget);
  });
}

function renderActiveView(reason) {
  const { view } = getState();
  syncActiveViewSection(view);

  if (view === 'home') {
    renderHomeView();
  } else if (view === 'explore') {
    renderExploreView(reason === 'explore-grid');
  } else if (view === 'guide') {
    renderGuideView();
  } else if (view === 'studio') {
    renderStudioView(reason);
  } else if (view === 'favorites') {
    renderFavoritesView();
  } else if (view === 'cart') {
    renderCartView();
  } else if (view === 'operator') {
    renderOperatorView();
  } else if (view === 'admin') {
    renderAdminView();
  } else if (view === 'login') {
    renderLoginView();
  } else if (view === 'login-user') {
    renderRoleLoginView('user');
  } else if (view === 'login-operator') {
    renderRoleLoginView('operator');
  } else if (view === 'login-admin') {
    renderRoleLoginView('admin');
  }
}

function bootstrap() {
  renderHeader();
  renderFooter();
  renderGuideView();
  renderActiveView('all');
  initModalEvents();
  initFirebaseListeners();

  subscribe((_state, reason) => {
    if (reason === 'modal') {
      renderModal();
      return;
    }

    if (reason === 'header') {
      renderHeader();
      return;
    }

    renderHeader();
    renderFooter();

    if (reason === 'favorites') {
      renderModal();
      renderActiveView('all');
      return;
    }

    if (
      reason === 'explore-grid' ||
      reason === 'wardrobe-grid' ||
      reason === 'studio-outfits' ||
      reason === 'studio-rotate'
    ) {
      renderActiveView(reason);
      return;
    }

    renderActiveView('all');
  });
}

bootstrap();

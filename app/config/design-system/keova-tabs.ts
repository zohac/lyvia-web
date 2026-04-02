/**
 * Keova Design System — Tabs (Segmented / ButtonGroup)
 *
 * Composant pour choix rapides, comparatifs et mutuellement exclusifs.
 *
 * Typologies (Nuxt UI supporte uniquement):
 * - pill (défaut): Style segmented Keova — pill container + pill items
 * - link: Style underline classique pour navigation secondaire
 *
 * Tailles (accessibilité & Fitts Law):
 * - sm: 36px min-height — toolbar / filtres compacts
 * - md: 40px min-height — défaut (80% des cas)
 * - lg: 48px min-height — landing / hero filters
 *
 * États:
 * - inactive: transparent, text muted
 * - hover: fond clair subtil (rgba(255,255,255,0.85))
 * - active/selected: background white + shadow-card + border
 * - disabled: opacity 55%
 * - focus-visible: ring Keova
 *
 * Règle UX:
 * - 2 à 5 options maximum
 * - Un Segmented change un état, il ne déclenche pas une action
 */
export const keovaTabs = {
  /**
   * SLOTS
   * -----
   * Les slots définissent les classes CSS de base pour chaque élément HTML
   * du composant UTabs. Ils sont toujours appliqués, indépendamment des variants.
   */
  slots: {
    /**
     * root: Conteneur principal du composant UTabs
     * Wrap l'ensemble (list + content). Utilisé pour le layout global.
     */
    root: 'flex items-center gap-2',

    /**
     * list: Conteneur des triggers (le "bar" de tabs)
     * C'est la zone visuelle qui regroupe tous les boutons de tab.
     * En mode pill Keova: fond stone-100, border, rounded-full, shadow.
     */
    list: [
      'relative', // Nécessaire pour positionner l'indicator en absolute
      'inline-flex', // Flex horizontal par défaut
      'items-center', // Centrage vertical des triggers
      'p-1.5', // Padding interne du container (espace autour des triggers)
      'gap-1.5', // Espacement entre chaque trigger
      'group' // Permet le styling conditionnel via group-*
    ].join(' '),

    /**
     * indicator: Élément visuel qui glisse derrière le tab actif
     * Animé automatiquement par Reka UI (--reka-tabs-indicator-size/position).
     * En mode pill: c'est le fond blanc avec shadow qui se déplace.
     * En mode link: c'est la ligne sous le texte actif.
     */
    indicator: [
      'absolute', // Positionné par rapport à list
      'transition-all duration-200 ease-out' // Animation fluide du déplacement
    ].join(' '),

    /**
     * trigger: Chaque bouton de tab individuel
     * C'est l'élément cliquable. Contient icon + label + badge.
     * Gère tous les états: default, hover, active, disabled, focus.
     */
    trigger: [
      'group', // Pour styling conditionnel des enfants
      'relative', // Pour positionnement d'éléments internes si besoin
      'inline-flex', // Layout horizontal icon + label + badge
      'items-center', // Centrage vertical du contenu
      'justify-center', // Centrage horizontal (utile en mode full-width)
      'min-w-0', // Permet au texte de tronquer si trop long
      'gap-2', // Espace entre icon/label/badge
      'font-bold', // Keova: texte bold pour les triggers
      'leading-none', // Pas d'interligne supplémentaire
      'border', // Border toujours présent (transparent par défaut)
      'border-transparent', // Invisible par défaut, visible quand actif
      'rounded-full', // Forme pill pour chaque trigger
      'bg-transparent', // Fond transparent par défaut
      'text-[color:var(--color-brand-secondary)]', // Couleur texte inactive
      'transition-all duration-200 ease-out', // Animation fluide

      // === HOVER STATE ===
      'hover:bg-[rgba(255,255,255,0.85)]', // Fond blanc translucide au survol

      // === ACTIVE STATE (tab sélectionné) ===
      // Nuxt UI utilise data-[state=active] pour le tab actuellement sélectionné
      'data-[state=active]:bg-[color:var(--color-surface-card)]', // Fond blanc
      'data-[state=active]:border-[color:var(--color-brand-subtle)]', // Border visible
      'data-[state=active]:text-[color:var(--color-brand-primary)]', // Texte noir
      'data-[state=active]:shadow-[var(--shadow-card)]', // Shadow Keova

      // === DISABLED STATE ===
      'disabled:opacity-55', // Opacité réduite
      'disabled:cursor-not-allowed', // Curseur interdit
      'disabled:pointer-events-none', // Pas de clic possible

      // === FOCUS VISIBLE (accessibilité clavier) ===
      'focus-visible:outline-none', // Pas d'outline natif
      'focus-visible:ring-4', // Ring Keova
      'focus-visible:ring-[color:var(--color-field-ring)]', // Couleur du ring

      // === ACTIVE PRESS (feedback tactile) ===
      'active:scale-[0.98]' // Légère réduction au clic (micro-interaction)
    ].join(' '),

    /**
     * leadingIcon: Icône affichée AVANT le label
     * Défini via la prop `icon` sur chaque TabsItem.
     * Ex: { label: 'Settings', icon: 'i-lucide-settings' }
     */
    leadingIcon: 'shrink-0', // Ne rétrécit pas si le label est trop long

    /**
     * leadingAvatar: Avatar affiché AVANT le label
     * Défini via la prop `avatar` sur chaque TabsItem.
     * Ex: { label: 'User', avatar: { src: '/photo.jpg' } }
     */
    leadingAvatar: 'shrink-0',

    /**
     * leadingAvatarSize: Taille de l'avatar (mapped via size variant)
     * Valeurs possibles: "3xs", "2xs", "xs", etc.
     * Défini dynamiquement dans variants.size.
     */
    leadingAvatarSize: '',

    /**
     * label: Le texte du tab
     * Tronqué automatiquement si trop long (truncate).
     */
    label: 'truncate',

    /**
     * trailingBadge: Badge affiché APRÈS le label
     * Défini via la prop `badge` sur chaque TabsItem.
     * Ex: { label: 'Messages', badge: '12' }
     * Stylé selon Keova: pill fond keova translucide.
     */
    trailingBadge: [
      'shrink-0', // Ne rétrécit pas
      'inline-flex', // Layout flex
      'items-center', // Centrage vertical
      'justify-center', // Centrage horizontal
      'min-w-5', // Largeur minimum (pour "9" vs "99")
      'h-5', // Hauteur fixe
      'px-1.5', // Padding horizontal
      'rounded-full', // Forme pill
      'text-xs', // Petite taille de texte
      'font-bold', // Texte bold
      // "bg-[rgba(212,184,160,0.35)]", // Fond keova translucide (DS Keova)
      'text-[color:var(--color-brand-primary)]' // Texte noir
    ].join(' '),

    /**
     * trailingBadgeSize: Taille du badge (utilisé par UBadge interne)
     * "sm" = small badge
     */
    trailingBadgeSize: 'sm',

    /**
     * content: Conteneur du contenu de chaque tab
     * C'est la zone qui affiche le contenu associé au tab sélectionné.
     * Rendu via le slot #content ou le slot nommé dynamiquement.
     */
    content: 'focus:outline-none w-full'
  },

  /**
   * VARIANTS
   * --------
   * Les variants permettent de modifier conditionnellement les classes CSS
   * selon les props passées au composant: color, variant, orientation, size.
   */
  variants: {
    /**
     * color: Couleur sémantique (utilisé pour les compoundVariants)
     * En Keova, on utilise principalement "primary" (défaut).
     * Les autres couleurs peuvent être utilisées pour des cas spéciaux.
     */
    color: {
      primary: '',
      secondary: '',
      success: '',
      info: '',
      warning: '',
      error: '',
      neutral: ''
    },

    /**
     * variant: Style visuel du tabs
     * - pill: Style segmented Keova (défaut) — container arrondi avec fond
     * - link: Style underline classique — ligne sous le tab actif
     */
    variant: {
      /**
       * Pill: Style segmented Keova (défaut)
       * Container avec fond stone-100, border stone-200, shadow-card, rounded-full.
       * Les triggers grandissent pour remplir l'espace (grow).
       */
      pill: {
        list: [
          'bg-[color:var(--color-surface-highlight)]', // Fond stone-100
          'border', // Border visible
          'border-[color:var(--color-brand-subtle)]', // Border stone-200
          'rounded-full', // Container pill
          'shadow-[var(--shadow-card)]' // Shadow Keova
        ].join(' '),
        trigger: 'grow', // Chaque trigger occupe l'espace disponible équitablement
        indicator: 'rounded-full' // L'indicator est aussi pill
      },

      /**
       * Link: Style underline classique
       * Pas de fond sur le container, juste une ligne sous le tab actif.
       * Utilisé pour navigation secondaire ou contextes épurés.
       */
      link: {
        list: 'border-b border-[color:var(--color-brand-subtle)]', // Ligne sous tous les tabs
        indicator: 'rounded-full bg-[color:var(--color-brand-primary)]', // Ligne active (épaisse)
        trigger: [
          'rounded-none', // Pas de rounded (style underline)
          'border-0', // Pas de border sur les triggers
          'bg-transparent', // Jamais de fond
          'hover:bg-transparent', // Pas de fond au hover non plus
          'data-[state=active]:bg-transparent', // Pas de fond quand actif
          'data-[state=active]:border-0', // Pas de border quand actif
          'data-[state=active]:shadow-none', // Pas de shadow quand actif
          'data-[state=active]:text-[color:var(--color-brand-primary)]' // Juste le texte change
        ].join(' ')
      }
    },

    /**
     * orientation: Direction du layout
     * - horizontal (défaut): Tabs côte à côte, contenu en dessous
     * - vertical: Tabs empilés, contenu à droite
     */
    orientation: {
      horizontal: {
        root: 'flex-col', // Root en colonne (list au-dessus, content en dessous)
        list: 'w-full', // List prend toute la largeur
        // Indicator animé horizontalement via CSS custom properties Reka UI
        indicator: 'left-0 w-(--reka-tabs-indicator-size) translate-x-(--reka-tabs-indicator-position)',
        trigger: 'justify-center' // Centrage du contenu des triggers
      },
      vertical: {
        list: 'flex-col', // List en colonne (tabs empilés)
        // Indicator animé verticalement
        indicator: 'top-0 h-(--reka-tabs-indicator-size) translate-y-(--reka-tabs-indicator-position)'
      }
    },

    /**
     * size: Taille des triggers (Fitts Law pour accessibilité tactile)
     * Plus grand = plus facile à cliquer.
     * xs: 28px, sm: 36px, md: 40px, lg: 48px, xl: 56px
     */
    size: {
      xs: {
        trigger: 'px-2 py-1 min-h-7 text-xs gap-1', // 28px height
        leadingIcon: 'size-4', // 16px icon
        leadingAvatarSize: '3xs' // Très petit avatar
      },
      sm: {
        trigger: 'px-3 py-2 min-h-9 text-sm gap-1.5', // 36px height
        leadingIcon: 'size-4',
        leadingAvatarSize: '3xs'
      },
      md: {
        trigger: 'px-3.5 py-2.5 min-h-10 text-sm gap-2', // 40px height (défaut)
        leadingIcon: 'size-5', // 20px icon
        leadingAvatarSize: '2xs'
      },
      lg: {
        trigger: 'px-4 py-3 min-h-12 text-base gap-2', // 48px height
        leadingIcon: 'size-5',
        leadingAvatarSize: '2xs'
      },
      xl: {
        trigger: 'px-5 py-3.5 min-h-14 text-base gap-2', // 56px height
        leadingIcon: 'size-6', // 24px icon
        leadingAvatarSize: 'xs'
      }
    }
  },

  /**
   * COMPOUND VARIANTS
   * -----------------
   * Les compoundVariants permettent d'appliquer des classes CSS
   * uniquement quand PLUSIEURS conditions sont réunies.
   * Ex: orientation=horizontal ET variant=pill => ajouter inset-y-1.5 à indicator
   */
  compoundVariants: [
    /**
     * Horizontal + Pill
     * L'indicator a besoin d'un inset vertical pour ne pas toucher les bords du container.
     */
    {
      orientation: 'horizontal',
      variant: 'pill',
      class: {
        indicator: 'inset-y-1.5' // Marge haut/bas de l'indicator
      }
    },

    /**
     * Horizontal + Link
     * La list a une border-bottom, l'indicator est une ligne fine en dessous.
     */
    {
      orientation: 'horizontal',
      variant: 'link',
      class: {
        list: 'border-b -mb-px', // Border bottom avec compensation margin
        indicator: '-bottom-px h-0.5' // Ligne de 2px positionnée sur la border
      }
    },

    /**
     * Vertical + Pill
     * L'indicator a besoin d'un inset horizontal + la list doit être centrée.
     */
    {
      orientation: 'vertical',
      variant: 'pill',
      class: {
        indicator: 'inset-x-1.5', // Marge gauche/droite de l'indicator
        list: 'items-center' // Centrage des triggers
      }
    },

    /**
     * Vertical + Link
     * La list a une border-left (ou start), l'indicator est une ligne verticale.
     */
    {
      orientation: 'vertical',
      variant: 'link',
      class: {
        list: 'border-s -ms-px',
        indicator: '-start-px w-0.5'
      }
    },

    // =========================================================================
    // COLOR + VARIANT overrides
    // Nuxt UI defaults set `data-[state=active]:text-inverted` for pill tabs.
    // Keova pill uses white bg + dark text — we must override to prevent
    // white-on-white text.
    // =========================================================================
    {
      color: 'primary',
      variant: 'pill',
      class: {
        indicator: 'bg-[color:var(--color-surface-card)] shadow-[var(--shadow-card)]',
        trigger: 'data-[state=active]:text-[color:var(--color-brand-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-brand-primary)]'
      }
    },
    {
      color: 'neutral',
      variant: 'pill',
      class: {
        indicator: 'bg-[color:var(--color-surface-card)] shadow-[var(--shadow-card)]',
        trigger: 'data-[state=active]:text-[color:var(--color-brand-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-brand-secondary)]'
      }
    },
    {
      color: 'primary',
      variant: 'link',
      class: {
        indicator: 'bg-[color:var(--color-brand-primary)]',
        trigger: 'data-[state=active]:text-[color:var(--color-brand-primary)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--color-brand-primary)]'
      }
    },
    {
      color: 'neutral',
      variant: 'link',
      class: {
        indicator: 'bg-[color:var(--color-brand-primary)]',
        trigger: 'data-[state=active]:text-[color:var(--color-brand-primary)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--color-brand-secondary)]'
      }
    }
  ],

  /**
   * DEFAULT VARIANTS
   * ----------------
   * Valeurs par défaut quand les props ne sont pas spécifiées.
   */
  defaultVariants: {
    color: 'primary', // Couleur par défaut
    variant: 'pill', // Style segmented Keova par défaut
    size: 'md' // Taille 40px par défaut
  }
}

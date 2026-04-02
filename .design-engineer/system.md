# Keova Design System — Component Reference

## DsPageHeader

Dashboard page header with serif italic title, accent bar, and action slots.

**Component:** `app/components/atoms/DsPageHeader.vue`
**Auto-import:** `<AtomsDsPageHeader>`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string?` | — | Title text (alternative to default slot) |
| `subtitle` | `string?` | — | Subtitle text (alternative to #subtitle slot) |
| `accentBar` | `boolean` | `true` | Show gradient accent bar on the left |

### Slots

| Slot | Description |
|------|-------------|
| `default` | Title content (overrides `title` prop) |
| `#subtitle` | Subtitle content (overrides `subtitle` prop) |
| `#actions` | Right-aligned action buttons |
| `#back` | Back navigation link above the title |

### Usage

```vue
<AtomsDsPageHeader title="Mes clientes" subtitle="Gerez vos accompagnements">
  <template #actions>
    <UButton color="primary" size="sm">Ajouter</UButton>
  </template>
</AtomsDsPageHeader>
```

---

## DsEmptyState

Centered empty state with icon, title, description, and optional CTA.

**Component:** `app/components/atoms/DsEmptyState.vue`
**Auto-import:** `<AtomsDsEmptyState>`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `string` | `'i-lucide-inbox'` | Iconify icon name |
| `title` | `string` | *required* | Title text |
| `description` | `string?` | — | Description text |
| `ctaLabel` | `string?` | — | CTA button label |
| `ctaTo` | `string?` | — | CTA navigation target (renders NuxtLink) |

### Usage

```vue
<AtomsDsEmptyState
  icon="i-lucide-calendar"
  title="Aucun rendez-vous"
  description="Vous n'avez pas encore de rendez-vous planifie."
  cta-label="Planifier un RDV"
  cta-to="/provider/calendar"
/>
```

---

## DsErrorState

Error state with retry button.

**Component:** `app/components/atoms/DsErrorState.vue`
**Auto-import:** `<AtomsDsErrorState>`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | `'Une erreur est survenue'` | Error message |
| `retryLabel` | `string` | `'Reessayer'` | Retry button label |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `retry` | — | Emitted when retry button is clicked |

### Usage

```vue
<AtomsDsErrorState
  message="Impossible de charger les donnees"
  @retry="fetchData"
/>
```

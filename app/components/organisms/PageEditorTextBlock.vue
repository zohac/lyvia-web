<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { sanitizeHtmlContent } from '~/features/pages/domain/paste-sanitizer'
import { escapeHtml, textToHtml } from '~/features/pages/domain/text-html'
import type { GuidedDestination, GuidedLinkInsert } from '~/features/pages/domain/guided-links'
import GuidedLinkModal from '~/components/organisms/GuidedLinkModal.vue'

/**
 * V2.2b — Accessible rich-text block editor (`contenteditable` native).
 *
 * Zero editor dependency: the toolbar applies native editing commands to the
 * DOM, then the HTML is normalized through the SAME allowlist as the server
 * (`sanitizeHtmlContent`) on blur / before save. The `page-block-text` class is
 * shared with `BlockText.vue`, so the editor is faithful to the public render.
 */
const props = withDefaults(
  defineProps<{
    modelValue: string
    destinations?: readonly GuidedDestination[]
    autofocus?: boolean
    label?: string
  }>(),
  {
    destinations: () => [],
    autofocus: false,
    label: 'Contenu du bloc'
  }
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

interface ToolbarCommand {
  id: string
  label: string
  icon: string
  command: string
  value?: string
  /** Optional separators rendered after this command. */
  separatorAfter?: boolean
}

const commands: ToolbarCommand[] = [
  { id: 'paragraph', label: 'Paragraphe', icon: 'i-lucide-pilcrow', command: 'formatBlock', value: '<p>', separatorAfter: true },
  { id: 'h2', label: 'Titre de section', icon: 'i-lucide-heading-2', command: 'formatBlock', value: '<h2>' },
  { id: 'h3', label: 'Sous-titre', icon: 'i-lucide-heading-3', command: 'formatBlock', value: '<h3>', separatorAfter: true },
  { id: 'bold', label: 'Gras', icon: 'i-lucide-bold', command: 'bold' },
  { id: 'italic', label: 'Italique', icon: 'i-lucide-italic', command: 'italic' },
  { id: 'underline', label: 'Souligné', icon: 'i-lucide-underline', command: 'underline', separatorAfter: true },
  { id: 'ul', label: 'Liste à puces', icon: 'i-lucide-list', command: 'insertUnorderedList' },
  { id: 'ol', label: 'Liste numérotée', icon: 'i-lucide-list-ordered', command: 'insertOrderedList', separatorAfter: true },
  { id: 'blockquote', label: 'Citation', icon: 'i-lucide-quote', command: 'formatBlock', value: '<blockquote>' }
]

const editorRef = ref<HTMLElement | null>(null)
const linkModalOpen = ref(false)
const activeCommands = ref<string[]>([])

let savedRange: Range | null = null

function syncFromDom() {
  emit('update:modelValue', editorRef.value?.innerHTML ?? '')
}

function setEditorHtml(html: string) {
  const editor = editorRef.value
  if (!editor || editor.innerHTML === html) return
  editor.innerHTML = html
}

onMounted(() => {
  setEditorHtml(props.modelValue ?? '')
  // Enter must create allowlisted `<p>` paragraphs, never `<div>` (which the
  // sanitizer would strip, collapsing multi-paragraph text).
  if (typeof document !== 'undefined') {
    try {
      document.execCommand('defaultParagraphSeparator', false, 'p')
    } catch {
      // Non-Chromium engines may not implement the command.
    }
  }
  if (props.autofocus) editorRef.value?.focus()
})

watch(
  () => props.modelValue,
  (value) => {
    // Never clobber the caret while the coach is typing.
    if (typeof document !== 'undefined' && document.activeElement === editorRef.value) return
    setEditorHtml(value ?? '')
  }
)

function runCommand(command: ToolbarCommand) {
  const editor = editorRef.value
  if (!editor || typeof document === 'undefined') return
  editor.focus()
  document.execCommand(command.command, false, command.value)
  syncFromDom()
  refreshActiveState()
}

function refreshActiveState() {
  if (typeof document === 'undefined') return
  const active: string[] = []
  for (const id of ['bold', 'italic', 'underline']) {
    try {
      if (document.queryCommandState(id)) active.push(id)
    } catch {
      // queryCommandState may throw outside a selection context.
    }
  }
  activeCommands.value = active
}

function isActive(id: string): boolean {
  return activeCommands.value.includes(id)
}

function onInput() {
  syncFromDom()
}

/**
 * Paste interception (spec AC): inline Word/Google Docs styles and disallowed
 * tags are stripped while the allowed structure (paragraphs, headings, bold,
 * lists) is preserved.
 */
function onPaste(event: ClipboardEvent) {
  if (typeof document === 'undefined') return
  const clipboard = event.clipboardData
  if (!clipboard) return

  event.preventDefault()
  const html = clipboard.getData('text/html')
  const text = clipboard.getData('text/plain')
  const source = html && html.trim().length > 0 ? html : textToHtml(text)
  const safeHtml = sanitizeHtmlContent(source)

  document.execCommand('insertHTML', false, safeHtml)
  syncFromDom()
}

function onBlur() {
  const editor = editorRef.value
  if (!editor) return
  const normalized = sanitizeHtmlContent(editor.innerHTML)
  if (normalized !== editor.innerHTML) {
    editor.innerHTML = normalized
  }
  syncFromDom()
}

function openLinkModal() {
  if (typeof window === 'undefined') return
  const editor = editorRef.value
  const selection = window.getSelection()
  if (editor && selection && selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
    savedRange = selection.getRangeAt(0).cloneRange()
  } else {
    savedRange = null
  }
  linkModalOpen.value = true
}

function onInsertLink(payload: GuidedLinkInsert) {
  linkModalOpen.value = false
  const editor = editorRef.value
  if (!editor || typeof document === 'undefined' || typeof window === 'undefined') return

  editor.focus()
  let label = payload.label

  if (savedRange) {
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(savedRange)
    const selectedText = savedRange.toString()
    if (selectedText.trim().length > 0) label = selectedText
  }

  const targetAttrs = payload.target
    ? ` target="${payload.target}"${payload.rel ? ` rel="${payload.rel}"` : ''}`
    : ''
  const anchor = `<a href="${escapeHtml(payload.href)}"${targetAttrs}>${escapeHtml(label)}</a>`
  document.execCommand('insertHTML', false, anchor)

  savedRange = null
  syncFromDom()
}
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)]">
    <div
      role="toolbar"
      aria-label="Mise en forme du texte"
      class="flex flex-wrap items-center gap-1 border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted)] px-2 py-1.5"
    >
      <template
        v-for="command in commands"
        :key="command.id"
      >
        <button
          type="button"
          :aria-label="command.label"
          :title="command.label"
          :aria-pressed="['bold', 'italic', 'underline'].includes(command.id) ? isActive(command.id) : undefined"
          class="inline-flex size-8 items-center justify-center rounded-md text-[color:var(--color-text-secondary)] transition-colors hover:bg-[color:var(--color-surface-highlight)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-primary)]"
          :class="{ 'bg-[color:var(--color-surface-highlight)] text-[color:var(--color-brand-primary)]': isActive(command.id) }"
          @mousedown.prevent="runCommand(command)"
          @keydown.enter.prevent="runCommand(command)"
          @keydown.space.prevent="runCommand(command)"
        >
          <UIcon
            :name="command.icon"
            class="size-4"
          />
        </button>
        <span
          v-if="command.separatorAfter"
          class="mx-1 h-5 w-px bg-[color:var(--color-border-subtle)]"
          aria-hidden="true"
        />
      </template>

      <button
        type="button"
        aria-label="Insérer un lien"
        title="Insérer un lien"
        class="inline-flex size-8 items-center justify-center rounded-md text-[color:var(--color-text-secondary)] transition-colors hover:bg-[color:var(--color-surface-highlight)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-primary)]"
        @mousedown.prevent="openLinkModal"
        @keydown.enter.prevent="openLinkModal"
        @keydown.space.prevent="openLinkModal"
      >
        <UIcon
          name="i-lucide-link"
          class="size-4"
        />
      </button>
    </div>

    <div
      ref="editorRef"
      class="page-editor-text-block page-block-text min-h-28 w-full px-3 py-2 text-text-secondary font-sans leading-relaxed text-base sm:text-lg space-y-4 focus:outline-none"
      contenteditable="true"
      role="textbox"
      aria-multiline="true"
      :aria-label="label"
      data-placeholder="Écrivez votre texte…"
      @input="onInput"
      @blur="onBlur"
      @paste="onPaste"
      @keyup="refreshActiveState"
      @mouseup="refreshActiveState"
    />

    <GuidedLinkModal
      v-model:open="linkModalOpen"
      :destinations="destinations"
      @insert="onInsertLink"
    />
  </div>
</template>

<style scoped>
.page-editor-text-block:empty::before {
  content: attr(data-placeholder);
  color: var(--color-text-muted);
  pointer-events: none;
}
</style>

<template>
  <div class="w-full flex flex-col min-h-[420px] sm:min-h-[520px]">
    <!-- Formatting Toolbar -->
    <div
      v-if="editor && showToolbar"
      class="flex flex-wrap items-center gap-1 p-2 bg-black/20 border-b border-black/10 rounded-t text-xs font-mono text-stone-700 select-none mb-2"
    >
      <button
        type="button"
        class="px-2 py-1 rounded hover:bg-black/10 transition cursor-pointer font-bold"
        :class="{ 'bg-black/20 text-black': editor.isActive('bold') }"
        title="Bold (Ctrl+B)"
        @click="editor.chain().focus().toggleBold().run()"
      >
        B
      </button>

      <button
        type="button"
        class="px-2 py-1 rounded hover:bg-black/10 transition cursor-pointer italic"
        :class="{ 'bg-black/20 text-black': editor.isActive('italic') }"
        title="Italic (Ctrl+I)"
        @click="editor.chain().focus().toggleItalic().run()"
      >
        I
      </button>

      <div class="w-px h-4 bg-black/15 mx-1"></div>

      <button
        type="button"
        class="px-2 py-1 rounded hover:bg-black/10 transition cursor-pointer"
        :class="{ 'bg-black/20 text-black': editor.isActive('heading', { level: 2 }) }"
        title="Heading"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      >
        H2
      </button>

      <button
        type="button"
        class="px-2 py-1 rounded hover:bg-black/10 transition cursor-pointer"
        :class="{ 'bg-black/20 text-black': editor.isActive('heading', { level: 3 }) }"
        title="Subheading"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      >
        H3
      </button>

      <div class="w-px h-4 bg-black/15 mx-1"></div>

      <button
        type="button"
        class="px-2 py-1 rounded hover:bg-black/10 transition cursor-pointer"
        :class="{ 'bg-black/20 text-black': editor.isActive('bulletList') }"
        title="Bullet List"
        @click="editor.chain().focus().toggleBulletList().run()"
      >
        • List
      </button>

      <button
        type="button"
        class="px-2 py-1 rounded hover:bg-black/10 transition cursor-pointer"
        :class="{ 'bg-black/20 text-black': editor.isActive('orderedList') }"
        title="Numbered List"
        @click="editor.chain().focus().toggleOrderedList().run()"
      >
        1. List
      </button>

      <button
        type="button"
        class="px-2 py-1 rounded hover:bg-black/10 transition cursor-pointer"
        :class="{ 'bg-black/20 text-black': editor.isActive('blockquote') }"
        title="Quote"
        @click="editor.chain().focus().toggleBlockquote().run()"
      >
        “ ”
      </button>

      <button
        type="button"
        class="px-2 py-1 rounded hover:bg-black/10 transition cursor-pointer"
        :class="{ 'bg-black/20 text-black': editor.isActive('codeBlock') }"
        title="Code Block"
        @click="editor.chain().focus().toggleCodeBlock().run()"
      >
        &lt;/&gt;
      </button>

      <div class="w-px h-4 bg-black/15 mx-1"></div>

      <button
        type="button"
        class="px-2 py-1 rounded hover:bg-black/10 transition cursor-pointer text-stone-500"
        title="Horizontal Rule"
        @click="editor.chain().focus().setHorizontalRule().run()"
      >
        ―
      </button>
    </div>

    <!-- Tiptap Editor Content Area -->
    <editor-content
      :editor="editor"
      class="prose max-w-none flex-1 focus:outline-none focus:ring-0 leading-relaxed text-sm sm:text-base font-serif px-2 sm:px-4 py-2 min-h-[380px]"
    />
  </div>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

const props = withDefaults(
  defineProps<{
    modelValue: string
    showToolbar?: boolean
    placeholder?: string
  }>(),
  {
    showToolbar: true,
    placeholder: 'Write your thoughts, reflections, or notes here...',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string, wordCount: number): void
}>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
  ],
  editorProps: {
    attributes: {
      class: 'focus:outline-none min-h-[360px] w-full',
    },
  },
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    const text = editor.getText()
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    
    emit('update:modelValue', html)
    emit('change', html, words)
  },
})

// Sync external modelValue updates (e.g. when changing pages)
watch(
  () => props.modelValue,
  (newVal) => {
    if (editor.value && editor.value.getHTML() !== newVal) {
      editor.value.commands.setContent(newVal, { emitUpdate: false })
    }
  }
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style>
/* Tiptap Custom Styles for Vintage Paper */
.ProseMirror {
  outline: none !important;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: rgba(120, 100, 80, 0.45);
  pointer-events: none;
  height: 0;
  font-style: italic;
}

.ProseMirror p {
  margin-bottom: 1.25rem;
  line-height: 1.8;
}

.ProseMirror h2 {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  font-size: 1.4rem;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding-bottom: 0.25rem;
}

.ProseMirror h3 {
  font-family: 'Playfair Display', serif;
  font-weight: 600;
  font-size: 1.15rem;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
}

.ProseMirror blockquote {
  border-left: 3px solid rgba(180, 140, 90, 0.6);
  padding-left: 1rem;
  font-style: italic;
  margin: 1.25rem 0;
}

.ProseMirror pre {
  background: rgba(0, 0, 0, 0.15);
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-family: 'Fira Code', monospace;
  font-size: 0.85rem;
  overflow-x: auto;
}

.ProseMirror code {
  background: rgba(0, 0, 0, 0.08);
  padding: 0.15rem 0.35rem;
  border-radius: 0.25rem;
  font-family: 'Fira Code', monospace;
  font-size: 0.85em;
}
</style>

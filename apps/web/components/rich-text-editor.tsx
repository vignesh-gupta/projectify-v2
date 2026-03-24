"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Subscript from "@tiptap/extension-subscript"
import Superscript from "@tiptap/extension-superscript"
import Link from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  UnderlineIcon,
  Link2,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  Undo,
  Redo,
  List,
  ListOrdered,
  Code2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { useCallback, useEffect } from "react"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  editable?: boolean
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Enter description...",
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Subscript,
      Superscript,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      if (editable) {
        onChange(editor.getHTML())
      }
    },
    editorProps: {
      attributes: {
        class: editable
          ? "prose prose-sm max-w-none min-h-[120px] px-3 py-2 focus:outline-none"
          : "prose prose-sm max-w-none",
      },
    },
  })

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable)
    }
  }, [editor, editable])

  const setLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt("URL", previousUrl)

    if (url === null) return

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  const handleHeadingChange = (value: string) => {
    if (value === "paragraph") {
      editor.chain().focus().setParagraph().run()
    } else {
      const level = parseInt(value.replace("h", "")) as 1 | 2 | 3
      editor.chain().focus().toggleHeading({ level }).run()
    }
  }

  const getCurrentHeading = () => {
    if (editor.isActive("heading", { level: 1 })) return "h1"
    if (editor.isActive("heading", { level: 2 })) return "h2"
    if (editor.isActive("heading", { level: 3 })) return "h3"
    return "paragraph"
  }

  if (!editable) {
    return (
      <div className="prose prose-sm max-w-none">
        <EditorContent editor={editor} />
      </div>
    )
  }

  return (
    <div className="w-full rounded-md border border-input bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-input bg-muted/30 p-2">
        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Heading Selector */}
        <Select value={getCurrentHeading()} onValueChange={handleHeadingChange}>
          <SelectTrigger className="h-8 w-27.5 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paragraph">Paragraph</SelectItem>
            <SelectItem value="h1">Heading 1</SelectItem>
            <SelectItem value="h2">Heading 2</SelectItem>
            <SelectItem value="h3">Heading 3</SelectItem>
          </SelectContent>
        </Select>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          data-active={editor.isActive("bulletList")}
          className="h-8 w-8 p-0 data-[active=true]:bg-muted"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          data-active={editor.isActive("orderedList")}
          className="h-8 w-8 p-0 data-[active=true]:bg-muted"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Code Block */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          data-active={editor.isActive("codeBlock")}
          className="h-8 w-8 p-0 data-[active=true]:bg-muted"
        >
          <Code2 className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Text Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          data-active={editor.isActive("bold")}
          className="h-8 w-8 p-0 data-[active=true]:bg-muted"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          data-active={editor.isActive("italic")}
          className="h-8 w-8 p-0 data-[active=true]:bg-muted"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          data-active={editor.isActive("strike")}
          className="h-8 w-8 p-0 data-[active=true]:bg-muted"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          data-active={editor.isActive("code")}
          className="h-8 w-8 p-0 data-[active=true]:bg-muted"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          data-active={editor.isActive("underline")}
          className="h-8 w-8 p-0 data-[active=true]:bg-muted"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Link */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={setLink}
          data-active={editor.isActive("link")}
          className="h-8 w-8 p-0 data-[active=true]:bg-muted"
        >
          <Link2 className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Super/Subscript */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          data-active={editor.isActive("superscript")}
          className="h-8 w-8 p-0 data-[active=true]:bg-muted"
        >
          <SuperscriptIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          data-active={editor.isActive("subscript")}
          className="h-8 w-8 p-0 data-[active=true]:bg-muted"
        >
          <SubscriptIcon className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Text Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          data-active={editor.isActive({ textAlign: "left" })}
          className="h-8 w-8 p-0 data-[active=true]:bg-muted"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          data-active={editor.isActive({ textAlign: "center" })}
          className="h-8 w-8 p-0 data-[active=true]:bg-muted"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          data-active={editor.isActive({ textAlign: "right" })}
          className="h-8 w-8 p-0 data-[active=true]:bg-muted"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          data-active={editor.isActive({ textAlign: "justify" })}
          className="h-8 w-8 p-0 data-[active=true]:bg-muted"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        placeholder={placeholder}
        className="line-clamp-10"
      />
    </div>
  )
}

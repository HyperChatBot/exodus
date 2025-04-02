import MonacoEditor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import { FieldValues, useController, UseControllerProps } from 'react-hook-form'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  }
}
loader.config({ monaco })

export function CodeEditor<T extends FieldValues>({
  props,
  className
}: {
  props: UseControllerProps<T>
  className?: string
}) {
  const { field } = useController(props)

  const handleEditorChange = (value?: string) => {
    field.onChange(value)
  }

  const defineTheme = () => {
    const isDark = window.document.documentElement.classList.contains('dark')
    return isDark ? 'shadcn-dark' : 'light'
  }
  return (
    <MonacoEditor
      className={className}
      theme={defineTheme()}
      defaultLanguage="json"
      value={field.value}
      onChange={handleEditorChange}
      beforeMount={(monaco) => {
        monaco.editor.defineTheme('shadcn-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: {
            'editor.background': '#000000'
          }
        })
      }}
    />
  )
}

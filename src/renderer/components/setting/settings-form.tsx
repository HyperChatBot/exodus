import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDbIo } from '@/hooks/use-db-io'
import { useSetting } from '@/hooks/use-setting'
import { models } from '@/lib/ai/models'
import { activeAtom } from '@/stores/setting'
import { zodResolver } from '@hookform/resolvers/zod'
import { Providers } from '@shared/types/ai'
import { useAtomValue } from 'jotai'
import { AlertCircle, Construction, Loader2 } from 'lucide-react'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import SyntaxHighlighter from 'react-syntax-highlighter'
import {
  atomOneDark,
  atomOneLight
} from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { toast } from 'sonner'
import useSWR from 'swr'
import { z } from 'zod'
import { AvatarUploader } from '../avatar-uploader'
import { CodeEditor } from '../code-editor'
import { useTheme } from '../theme-provider'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { UnderConstruction } from './under-construction'

const formSchema = z.object({
  provider: z.string().nullable(),
  chatModel: z.string().nullable(),
  reasoningModel: z.string().nullable(),
  openaiApiKey: z.string().nullable(),
  openaiBaseUrl: z.union([z.string().url().nullable(), z.literal('')]),
  azureOpenaiApiKey: z.string().nullable(),
  azureOpenAiEndpoint: z.union([z.string().url().nullable(), z.literal('')]),
  azureOpenAiApiVersion: z.string().nullable(),
  anthropicApiKey: z.string().nullable(),
  anthropicBaseUrl: z.union([z.string().url().nullable(), z.literal('')]),
  googleGeminiApiKey: z.string().nullable(),
  googleGeminiBaseUrl: z.union([z.string().url().nullable(), z.literal('')]),
  xAiApiKey: z.string().nullable(),
  xAiBaseUrl: z.union([z.string().url().nullable(), z.literal('')]),
  deepSeekApiKey: z.string().nullable(),
  deepSeekBaseUrl: z.union([z.string().url().nullable(), z.literal('')]),
  ollamaBaseUrl: z.string().nullable(),
  mcpServers: z.string().nullable(),
  speechToTextModel: z.string().nullable(),
  textToSpeechVoice: z.string().nullable(),
  textToSpeechModel: z.string().nullable(),
  fileUploadEndpoint: z.string().nullable(),
  assistantAvatar: z.string().nullable(),
  googleApiKey: z.string().nullable(),
  googleCseId: z.string().nullable(),
  maxSteps: z.coerce.number().nonnegative().lte(20).nullable()
})

export function SettingsForm() {
  const { exportData, loading: dbIoLoading } = useDbIo()
  const { actualTheme } = useTheme()
  const { data: settings, mutate, updateSetting } = useSetting()
  const activeTitle = useAtomValue(activeAtom)
  const { error } = useSWR(
    activeTitle === 'Ollama' && settings?.ollamaBaseUrl
      ? `/api/ollama/ping?url=${settings?.ollamaBaseUrl}`
      : null
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: settings,
    mode: 'onBlur'
  })

  const provider = form.watch('provider')

  const modelsOfProvider = useMemo(() => {
    if (provider) return models[provider as Providers]
    return null
  }, [provider])

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!settings) return

    if (form.formState.isDirty) {
      updateSetting({ id: settings.id, ...values })
      mutate()
      toast.success('Auto saved.')
    }
  }

  return (
    <Form {...form}>
      <form
        className="flex flex-1 flex-col gap-4"
        onBlur={form.handleSubmit(onSubmit)}
      >
        {activeTitle === 'File Upload Endpoint' && (
          <>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="inline">
                By default, Exodus encodes uploaded attachments into{' '}
                <strong>base64</strong> for prompt integration. To use your own
                upload API, configure it here. Verify that the generated image
                URLs are reachable by the models.
                <Tabs defaultValue="request" className="mt-2 w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="request">Request</TabsTrigger>
                    <TabsTrigger value="response">Response</TabsTrigger>
                  </TabsList>
                  <TabsContent value="request">
                    <Card className="rounded-md p-0">
                      <SyntaxHighlighter
                        PreTag="div"
                        language="typescript"
                        style={
                          actualTheme === 'dark' ? atomOneDark : atomOneLight
                        }
                        customStyle={{
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem'
                        }}
                      >
                        {'// method POST\n\n' +
                          'const files = e.target.files\n' +
                          'const formData = new FormData()\n\n' +
                          '// retrieve `files` from FormData\n' +
                          '// and upload them to your own bucket like S3.\n' +
                          "formData.append('files', files) "}
                      </SyntaxHighlighter>
                    </Card>
                  </TabsContent>
                  <TabsContent value="response">
                    <Card className="rounded-md p-0">
                      <SyntaxHighlighter
                        PreTag="div"
                        language="json"
                        style={
                          actualTheme === 'dark' ? atomOneDark : atomOneLight
                        }
                        customStyle={{
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem'
                        }}
                      >
                        {'// Your response JSON should be like:\n\n' +
                          '[\n' +
                          '  {\n' +
                          '    "name": "fakeimg.jpg",\n' +
                          '    "url": "e.g. https://fakeimg.pl/300/",\n' +
                          '    "contentType": "image/jpg"\n' +
                          '  },\n' +
                          '  ...\n' +
                          ']'}
                      </SyntaxHighlighter>
                    </Card>
                  </TabsContent>
                </Tabs>
              </AlertDescription>
            </Alert>
            <FormField
              control={form.control}
              name="fileUploadEndpoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endpoint</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      id="file-upload-endpoint-input"
                      placeholder="https://api.your-domain.com/upload"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>{' '}
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {activeTitle === 'Assistant Avatar' && (
          <AvatarUploader
            props={{ control: form.control, name: 'assistantAvatar' }}
          />
        )}

        {activeTitle === 'Providers' && (
          <>
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(value) => {
                      field.onChange(value)
                      form.setValue('chatModel', '')
                      form.setValue('reasoningModel', '')
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={Providers.OpenAiGpt} />
                      </SelectTrigger>
                    </FormControl>{' '}
                    <FormMessage />
                    <SelectContent>
                      {Object.values(Providers).map((val) => (
                        <SelectItem key={val} value={val}>
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="chatModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chat Model</FormLabel>
                  <Select
                    disabled={!provider}
                    onValueChange={field.onChange}
                    value={field.value ?? ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={`Select a chat model belongs to ${provider}`}
                        />
                      </SelectTrigger>
                    </FormControl>{' '}
                    <FormMessage />
                    <SelectContent>
                      {modelsOfProvider?.chatModel?.map((val) => (
                        <SelectItem key={val} value={val}>
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reasoningModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reasoning Model</FormLabel>
                  <Select
                    disabled={!provider}
                    onValueChange={field.onChange}
                    value={field.value ?? ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={`Select a reasoning model belongs to ${provider}`}
                        />
                      </SelectTrigger>
                    </FormControl>{' '}
                    <FormMessage />
                    <SelectContent>
                      {modelsOfProvider?.reasoningModel?.map((val) => (
                        <SelectItem key={val} value={val}>
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxSteps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Steps</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      id="max-steps-input"
                      autoFocus
                      {...field}
                      value={field.value ?? 1}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum number of sequential LLM calls (steps), e.g. when
                    you use tool calls. A maximum number is required to prevent
                    infinite loops in the case of misconfigured tools. By
                    default, it is set to 1.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {activeTitle === Providers.OpenAiGpt && (
          <>
            <FormField
              control={form.control}
              name="openaiApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      id="openai-api-key-input"
                      autoComplete="current-password"
                      autoFocus
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>{' '}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="openaiBaseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base URL</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      id="openai-base-url-input"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>{' '}
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {activeTitle === Providers.AzureOpenAi && (
          <>
            <FormField
              control={form.control}
              name="azureOpenaiApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      id="azure-openai-api-key-input"
                      autoFocus
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>{' '}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="azureOpenAiEndpoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endpoint</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      id="azure-openai-endpoint"
                      placeholder="https://{resourceName}.openai.azure.com/openai/deployments/{modelId}{path}"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>{' '}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="azureOpenAiApiVersion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Version</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      id="azure-openai-api-version"
                      placeholder="2024-12-01-preview"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>{' '}
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {activeTitle === Providers.AnthropicClaude && (
          <>
            <FormField
              control={form.control}
              name="anthropicApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      id="anthropic-api-key-input"
                      autoFocus
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>{' '}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="anthropicBaseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base URL</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      id="anthropic-base-url-input"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>{' '}
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {activeTitle === Providers.GoogleGemini && (
          <>
            <FormField
              control={form.control}
              name="googleGeminiApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      id="google-api-key-input"
                      autoFocus
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>{' '}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="googleGeminiBaseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base URL</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      id="google-base-url-input"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>{' '}
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {activeTitle === Providers.XaiGrok && (
          <>
            <FormField
              control={form.control}
              name="xAiApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      id="xai-api-key-input"
                      autoFocus
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>{' '}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="xAiBaseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base URL</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      id="xai-base-url-input"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>{' '}
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {activeTitle === Providers.DeepSeek && (
          <>
            <FormField
              control={form.control}
              name="deepSeekApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      id="deep-seek-api-key-input"
                      autoFocus
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>{' '}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deepSeekBaseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base URL</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      id="deep-seek-base-url-input"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>{' '}
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {activeTitle === Providers.Ollama && (
          <>
            <FormField
              control={form.control}
              name="ollamaBaseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base URL</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      id="ollama-base-url-input"
                      placeholder="http://localhost:11434"
                      autoFocus
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>{' '}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormLabel>Status</FormLabel>

            {error === undefined ? (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <p className="text-sm">Ollama is running.</p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <p className="text-sm">Ollama is not running.</p>
              </div>
            )}
          </>
        )}

        {activeTitle === 'MCP Servers' && (
          <>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="block">
                We&apos;ve detected an update to your MCP servers&apos;
                configuration. To apply these changes, please click{' '}
                <span className="hover:text-primary cursor-pointer font-bold underline">
                  RESTART
                </span>{' '}
                to launch your servers now, or restart the application manually.
              </AlertDescription>
            </Alert>
            <CodeEditor
              props={{ control: form.control, name: 'mcpServers' }}
              className="-mx-4 !w-[calc(100%+2rem)]"
            />
          </>
        )}

        {activeTitle === 'Audio and Speech' && (
          <>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="inline">
                The Text-to-Speech and Speech-to-Text services{' '}
                <strong>only support OpenAI</strong>. Please make sure you have
                configured the OpenAI API settings correctly before using these
                features.
              </AlertDescription>
            </Alert>

            <FormField
              control={form.control}
              name="speechToTextModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Speech to Text Model</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="whisper-1" />
                      </SelectTrigger>
                    </FormControl>{' '}
                    <FormMessage />
                    <SelectContent>
                      <SelectItem value="whisper-1">whisper-1</SelectItem>
                      <SelectItem value="gpt-4o-transcribe">
                        gpt-4o-transcribe
                      </SelectItem>
                      <SelectItem value="gpt-4o-mini-transcribe">
                        gpt-4o-mini-transcribe
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="textToSpeechModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text to Speech Model</FormLabel>

                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="tts-1" />
                      </SelectTrigger>
                    </FormControl>{' '}
                    <FormMessage />
                    <SelectContent>
                      <SelectItem value="tts-1">tts-1</SelectItem>
                      <SelectItem value="tts-1-hd">tts-1-hd</SelectItem>
                      <SelectItem value="gpt-4o-mini-tts">
                        gpt-4o-mini-tts
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="textToSpeechVoice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text to Speech Voice</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Alloy" />
                      </SelectTrigger>
                    </FormControl>{' '}
                    <FormMessage />
                    <SelectContent>
                      <SelectItem value="alloy">Alloy</SelectItem>
                      <SelectItem value="ash">Ash</SelectItem>
                      <SelectItem value="ballad">Ballad</SelectItem>
                      <SelectItem value="coral">Coral</SelectItem>
                      <SelectItem value="echo">Echo</SelectItem>
                      <SelectItem value="fable">Fable</SelectItem>
                      <SelectItem value="onyx">Onyx</SelectItem>
                      <SelectItem value="nova">Nova</SelectItem>
                      <SelectItem value="sage">Sage</SelectItem>
                      <SelectItem value="shimmer">Shimmer</SelectItem>
                      <SelectItem key="verse" value="verse">
                        Verse
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </>
        )}

        {activeTitle === 'Web Search' && (
          <>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="inline">
                To use Google Web Search API, you need to create the
                GOOGLE_API_KEY in the{' '}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline"
                >
                  Google Cloud credential console
                </a>{' '}
                and a GOOGLE_CSE_ID using the{' '}
                <a
                  href="https://programmablesearchengine.google.com/controlpanel/create"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline"
                >
                  Programmable Search Engine
                </a>
                .
              </AlertDescription>
            </Alert>
            <FormField
              control={form.control}
              name="googleApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google API Key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      id="google-search-api-key-input"
                      autoFocus
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>{' '}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="googleCseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google CSE ID</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      id="google-cse-id-input"
                      autoFocus
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>{' '}
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        {activeTitle === 'Deep Research' && <UnderConstruction />}
        {activeTitle === 'RAG' && <UnderConstruction />}
        {activeTitle === 'Artifacts' && <UnderConstruction />}
        {activeTitle === 'Browser Use' && <UnderConstruction />}
        {activeTitle === 'Computer Use' && <UnderConstruction />}
        {activeTitle === 'Data Controls' && (
          <>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="inline">
                Database data can be exported to your local file system.
              </AlertDescription>
            </Alert>

            <Button disabled>
              <Construction /> Import
            </Button>

            <Button
              disabled={dbIoLoading}
              onClick={exportData}
              className="cursor-pointer"
            >
              {dbIoLoading && <Loader2 className="animate-spin" />}
              Export
            </Button>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Danger Zone</AlertTitle>
              <AlertDescription>
                Erase all chats data, there is no going back. Please be certain.
                <Button
                  disabled
                  variant="destructive"
                  className="mt-4 w-full cursor-pointer"
                >
                  <Construction /> Delete
                </Button>
              </AlertDescription>
            </Alert>
          </>
        )}
        {activeTitle === 'Software Update' && <UnderConstruction />}
        {activeTitle === 'About Exodus' && <UnderConstruction />}
      </form>
    </Form>
  )
}

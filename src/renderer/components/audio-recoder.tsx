import { useAudio } from '@/hooks/use-audio'
import { AudioLines, CircleStop } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

export function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  // const [audioUrl, setAudioUrl] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const { speechToText } = useAudio()

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      mediaRecorderRef.current.start()
      setIsRecording(true)

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/mp3'
        })
        await speechToText(audioBlob as File)

        // const audioUrl = URL.createObjectURL(audioBlob)
        // setAudioUrl(audioUrl)
        audioChunksRef.current = []
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unknown error.')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  return (
    <section onClick={isRecording ? stopRecording : startRecording}>
      <AudioLines />
      <CircleStop />
      {/* {
      // the audio preview is just for test.
      audioUrl && (
        <audio controls>
          <source src={audioUrl} type="audio/mp3" />
          Your browser does not support the audio element.
        </audio>
      )} */}
    </section>
  )
}

export default AudioRecorder

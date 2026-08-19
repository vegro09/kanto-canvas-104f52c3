export type DictationLanguage = "ar-SA" | "en-US";

export interface DictationSession {
  start: () => void;
  stop: () => void;
  isListening: boolean;
}

interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function isDictationSupported(): boolean {
  if (typeof window === "undefined") return false;
  const win = window as unknown as IWindow;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export function createDictationSession(
  lang: DictationLanguage,
  onInterim: (text: string) => void,
  onFinal: (text: string) => void,
  onEnd: () => void,
  onError?: (err: string) => void,
): DictationSession {
  if (typeof window === "undefined" || !isDictationSupported()) {
    onError?.("Dictation is not supported in this browser.");
    return {
      start: () => {},
      stop: () => {},
      isListening: false,
    };
  }

  const win = window as unknown as IWindow;
  const SpeechRecognitionClass =
    win.SpeechRecognition || win.webkitSpeechRecognition;

  const recognition = new SpeechRecognitionClass();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = lang;
  recognition.maxAlternatives = 1;

  let isListening = false;

  recognition.onstart = () => {
    isListening = true;
  };

  recognition.onresult = (event: any) => {
    let interim = "";
    let finalChunk = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const item = event.results[i];
      if (item.isFinal) {
        finalChunk += item[0].transcript;
      } else {
        interim += item[0].transcript;
      }
    }

    if (finalChunk.trim()) {
      onFinal(finalChunk.trim());
    }
    if (interim.trim()) {
      onInterim(interim.trim());
    }
  };

  recognition.onerror = (event: any) => {
    if (event.error !== "no-speech" && event.error !== "aborted") {
      onError?.(event.error || "Dictation error");
    }
  };

  recognition.onend = () => {
    isListening = false;
    onEnd();
  };

  return {
    start: () => {
      try {
        if (!isListening) {
          recognition.start();
        }
      } catch (err: any) {
        if (err?.name !== "InvalidStateError") {
          onError?.(err?.message || "Could not start dictation");
        }
      }
    },
    stop: () => {
      try {
        if (isListening) {
          recognition.stop();
        }
      } catch (err) {
        console.warn("Dictation stop error:", err);
      }
    },
    get isListening() {
      return isListening;
    },
  };
}

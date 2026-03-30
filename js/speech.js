/**
 * 语音模块
 * 负责语音识别（Web Speech API）和语音合成
 */

const Speech = {
    // 语音识别对象
    recognition: null,
    
    // 是否正在识别
    isListening: false,
    
    // 初始化语音识别
    initRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return false;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        
        return true;
    },

    // 开始语音识别
    startRecognition(lang, onResult, onError, onEnd) {
        if (!this.recognition) {
            if (!this.initRecognition()) {
                onError && onError('浏览器不支持语音识别');
                return false;
            }
        }

        // 如果已经在识别中，先停止并等待
        if (this.isListening) {
            this.stopRecognition();
            // 延迟重新启动，确保之前的识别完全停止
            setTimeout(() => {
                this.startRecognition(lang, onResult, onError, onEnd);
            }, 100);
            return true;
        }

        this.recognition.lang = lang;
        this.isListening = true;

        let finalTranscript = '';
        let interimTranscript = '';

        this.recognition.onresult = (event) => {
            interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            onResult && onResult(finalTranscript + interimTranscript, !!interimTranscript);
        };

        this.recognition.onerror = (event) => {
            if (event.error === 'no-speech') {
                // 没有检测到语音，不报错
                return;
            }
            // 忽略"已启动"错误
            if (event.error === 'not-allowed') {
                onError && onError('请允许使用麦克风权限');
            } else if (event.error !== 'aborted') {
                onError && onError(event.error);
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            onEnd && onEnd(finalTranscript);
        };

        try {
            this.recognition.start();
            return true;
        } catch (e) {
            this.isListening = false;
            if (e.message && e.message.includes('already started')) {
                // 如果已经启动，忽略错误
                return true;
            }
            onError && onError(e.message);
            return false;
        }
    },

    // 停止语音识别
    stopRecognition() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (e) {
                // 忽略错误
            }
            this.isListening = false;
        }
    },

    // 检查是否支持语音识别
    isSupported() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    },

    // 获取语音合成语音
    getVoices() {
        return window.speechSynthesis.getVoices();
    },

    // 语音合成
    speak(text, lang, rate = 1.0, onEnd) {
        if (!window.speechSynthesis) {
            console.warn('Speech synthesis not supported');
            return false;
        }

        // 取消之前的朗读
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // 设置语言
        const langMap = {
            'zh-CN': 'zh-CN',
            'en-US': 'en-US',
            'th-TH': 'th-TH'
        };
        utterance.lang = langMap[lang] || lang;
        utterance.rate = rate;
        utterance.pitch = 1;

        // 尝试找到合适的语音
        const voices = this.getVoices();
        const voice = voices.find(v => v.lang.includes(lang.split('-')[0]));
        if (voice) {
            utterance.voice = voice;
        }

        if (onEnd) {
            utterance.onend = onEnd;
        }

        window.speechSynthesis.speak(utterance);
        return true;
    },

    // 停止朗读
    stopSpeaking() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    },

    // 检查是否正在朗读
    isSpeaking() {
        return window.speechSynthesis?.speaking || false;
    },

    // 暂停朗读
    pauseSpeaking() {
        if (window.speechSynthesis) {
            window.speechSynthesis.pause();
        }
    },

    // 恢复朗读
    resumeSpeaking() {
        if (window.speechSynthesis) {
            window.speechSynthesis.resume();
        }
    }
};

// 预加载语音列表
if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

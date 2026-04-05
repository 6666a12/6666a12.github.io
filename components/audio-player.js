// 音频播放器模块
const AudioPlayer = (function() {
    // 存储键名
    const STORAGE_KEY = 'audioPlayerState';
    
    // 默认播放列表
    const defaultList = [
        {artist: "Feryquitous", trackname: "愚か者の賢人論", src: "audio/Feryquitous - 愚か者の賢人論.mp3"},
        {artist: "Dachs", trackname: "Holy Night,Silent Night", src: "audio/Dachs - Holy Night, Silent Night.mp3"},
        {artist: "Dachs", trackname: "Mother Earth (Original Mix)", src: "audio/Mother Earth (Original Mix) - Dachs.mp3"},
        {artist: "DJ TOTTO", trackname: "童話回廊", src: "audio/DJ TOTTO - 童話回廊.mp3"},
        {artist: "polysha", trackname: "Where The Spirits Go on", src: "audio/polysha - Where The Spirits Go on.mp3"}
    ];

    // 状态
    let state = {
        isPlaying: false,
        currentPos: 0,
        playlist: [],
        audio: null,
        pgslider: null,
        pgtxt: null,
        pausebt: null,
        trackinfo: null
    };

    // 保存状态到 localStorage
    function saveState() {
        if (!state.audio) return;
        const stateToSave = {
            currentPos: state.currentPos,
            isPlaying: state.isPlaying,
            currentTime: state.audio.currentTime || 0,
            volume: state.audio.volume || 1,
            timestamp: Date.now()
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (e) {
            console.warn('无法保存播放状态:', e);
        }
    }

    // 从 localStorage 读取状态
    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('无法读取播放状态:', e);
        }
        return null;
    }

    // 跨页面同步：监听 storage 事件
    window.addEventListener('storage', function(e) {
        if (e.key === STORAGE_KEY && e.newValue) {
            const newState = JSON.parse(e.newValue);
            // 如果其他页面更新了状态，同步过来
            if (newState.timestamp > (state.lastSyncTime || 0)) {
                state.lastSyncTime = newState.timestamp;
                // 同步播放位置
                if (newState.currentPos !== state.currentPos) {
                    loadTrack(newState.currentPos);
                }
                // 同步播放进度（如果差异大于2秒）
                if (state.audio && Math.abs(state.audio.currentTime - newState.currentTime) > 2) {
                    state.audio.currentTime = newState.currentTime;
                }
                // 同步播放/暂停状态
                if (newState.isPlaying !== state.isPlaying) {
                    if (newState.isPlaying) {
                        state.audio.play();
                        state.isPlaying = true;
                    } else {
                        state.audio.pause();
                        state.isPlaying = false;
                    }
                    updatePauseButton();
                }
                // 同步音量
                if (state.audio && state.audio.volume !== newState.volume) {
                    state.audio.volume = newState.volume;
                }
            }
        }
    });

    // 工具函数：格式化时间
    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // 获取当前歌曲名称
    function getCurrentTrackName() {
        const track = state.playlist[state.currentPos];
        return track ? `${track.artist} - ${track.trackname}` : "请选择歌曲";
    }

    // 获取当前歌曲路径
    function getCurrentTrackSrc() {
        const track = state.playlist[state.currentPos];
        if (!track) return "";
        // 如果有基础路径配置，拼接路径
        const basePath = state.basePath || "";
        return basePath + track.src;
    }

    // 加载歌曲
    function loadTrack(index, autoPlay = null) {
        if (index < 0 || index >= state.playlist.length) return;
        state.currentPos = index;
        state.audio.src = getCurrentTrackSrc();
        if (state.trackinfo) {
            state.trackinfo.textContent = getCurrentTrackName();
        }
        if (state.pgslider) {
            state.pgslider.value = 0;
        }
        if (state.pgtxt) {
            state.pgtxt.textContent = "0:00 / 0:00";
        }
        // 如果指定了 autoPlay，使用指定值，否则使用当前状态
        const shouldPlay = autoPlay !== null ? autoPlay : state.isPlaying;
        if (shouldPlay) {
            state.audio.play().catch(e => console.log("自动播放被阻止:", e));
            state.isPlaying = true;
        }
        saveState();
        updatePauseButton();
    }

    // 上一首
    function prevTrack() {
        state.audio.pause();
        state.isPlaying = false;
        const len = state.playlist.length - 1;
        if (state.currentPos === 0) {
            state.currentPos = len;
        } else {
            state.currentPos--;
        }
        loadTrack(state.currentPos);
    }

    // 下一首
    function nextTrack() {
        state.audio.pause();
        state.isPlaying = false;
        const len = state.playlist.length - 1;
        if (state.currentPos === len) {
            state.currentPos = 0;
        } else {
            state.currentPos++;
        }
        loadTrack(state.currentPos);
    }

    // 播放/暂停切换
    function togglePlay() {
        if (state.isPlaying) {
            state.audio.pause();
        } else {
            if (!state.audio.src) {
                loadTrack(state.currentPos);
            }
            state.audio.play();
        }
        state.isPlaying = !state.isPlaying;
        saveState();
        updatePauseButton();
    }

    // 更新暂停按钮状态
    function updatePauseButton() {
        if (state.pausebt) {
            state.pausebt.innerText = state.isPlaying ? "⏸" : "▶";
        }
    }

    // 跳转进度
    function seek(percent) {
        if (!state.audio.duration) return;
        const time = state.audio.duration * (percent / 100);
        state.audio.currentTime = time;
        saveState();
    }

    // 设置音量
    function setVolume(percent) {
        state.audio.volume = percent;
        saveState();
    }

    // 初始化播放器
    function init(options) {
        // 合并自定义播放列表
        state.playlist = options.playlist || defaultList;
        // 设置基础路径（用于子页面）
        state.basePath = options.basePath || "";
        
        // 获取DOM元素
        state.audio = document.getElementById(options.audioId || "audio_player");
        state.pgslider = document.getElementById(options.sliderId || "pgslider");
        state.pgtxt = document.getElementById(options.timeId || "pgtxt");
        state.pausebt = document.getElementById(options.pauseBtnId || "pausebt");
        state.trackinfo = document.getElementById(options.trackInfoId || "trackinfo");

        if (!state.audio) {
            console.error("Audio player: 未找到音频元素");
            return;
        }

        // 绑定事件
        state.audio.ontimeupdate = function() {
            if (!state.audio.duration) return;
            const percent = state.audio.currentTime / state.audio.duration * 100;
            if (state.pgslider) {
                state.pgslider.value = percent || 0;
            }
            if (state.pgtxt) {
                const current = formatTime(state.audio.currentTime);
                const total = formatTime(state.audio.duration || 0);
                state.pgtxt.textContent = `${current} / ${total}`;
            }
        };

        state.audio.onended = function() {
            nextTrack();
            if (state.isPlaying) {
                state.audio.play();
            }
        };

        state.audio.onloadedmetadata = function() {
            if (state.pgtxt) {
                state.pgtxt.textContent = `0:00 / ${formatTime(state.audio.duration)}`;
            }
        };

        // 读取保存的状态
        const savedState = loadState();
        if (savedState) {
            // 恢复歌曲位置
            const trackIndex = savedState.currentPos || 0;
            // 恢复播放状态
            const shouldPlay = savedState.isPlaying || false;
            // 恢复音量
            state.audio.volume = savedState.volume || 1;
            
            // 加载歌曲（不自动播放，等设置好时间后再决定）
            state.currentPos = trackIndex;
            state.isPlaying = shouldPlay;
            
            // 设置音频源
            state.audio.src = getCurrentTrackSrc();
            if (state.trackinfo) {
                state.trackinfo.textContent = getCurrentTrackName();
            }
            
            // 恢复播放进度
            const savedTime = savedState.currentTime || 0;
            if (savedTime > 0) {
                state.audio.currentTime = savedTime;
            }
            
            // 如果之前在播放，继续播放
            if (shouldPlay) {
                state.audio.play().catch(e => {
                    console.log("自动播放被阻止:", e);
                    state.isPlaying = false;
                });
            }
            
            updatePauseButton();
            console.log("AudioPlayer 已恢复状态:", savedState);
        } else {
            // 初始化加载第一首
            loadTrack(0);
        }
        
        // 定期保存播放进度（每1秒）
        setInterval(saveState, 1000);
        
        // 页面可见性变化时保存/恢复状态
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'hidden') {
                saveState();
            }
        });

        console.log("AudioPlayer 初始化完成");
    }

    // 暴露公共API
    return {
        init: init,
        play: togglePlay,
        pause: function() { if (state.isPlaying) togglePlay(); },
        prev: prevTrack,
        next: nextTrack,
        seek: seek,
        setVolume: setVolume,
        loadTrack: loadTrack,
        get isPlaying() { return state.isPlaying; },
        get currentPos() { return state.currentPos; },
        get playlist() { return state.playlist; }
    };
})();

// 全局函数（供HTML按钮调用）
function pgdown() { AudioPlayer.prev(); }
function pgup() { AudioPlayer.next(); }
function pause() { AudioPlayer.play(); }
function seekaudio(value) { AudioPlayer.seek(value); }

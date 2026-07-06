// ============================================
// ADMOB MONETIZATION - Banner + Interstitial Ads
// ============================================

let adInitialized = false;
let interstitialReady = false;
let winCounter = 0;
let adsEnabled = true;
let adInProgress = false;

// YOUR REAL AD UNIT IDs FROM ADMOB CONSOLE
const BANNER_AD_ID = 'ca-app-pub-5834184703937435/4096610957';
const INTERSTITIAL_AD_ID = 'ca-app-pub-5834184703937435/8224547901';
const REWARDED_AD_ID = 'ca-app-pub-5834184703937435/1383839206';

function initializeAds() {
    if (adInitialized) return;
    
    if (typeof AdMob !== 'undefined') {
        try {
            AdMob.createBanner({
                adId: BANNER_AD_ID,
                position: AdMob.AD_POSITION.BOTTOM_CENTER,
                autoShow: true,
                isTesting: false
            });
            
            AdMob.prepareInterstitial({
                adId: INTERSTITIAL_AD_ID,
                isTesting: false
            });
            
            AdMob.on('admob.interstitial.events.LOAD', () => {
                interstitialReady = true;
                console.log('Interstitial ad loaded and ready');
            });
            
            AdMob.on('admob.interstitial.events.CLOSE', () => {
                interstitialReady = false;
                AdMob.prepareInterstitial({
                    adId: INTERSTITIAL_AD_ID,
                    isTesting: false
                });
            });
            
            adInitialized = true;
            console.log('AdMob initialized successfully');
        } catch (error) {
            console.log('AdMob error:', error);
            adsEnabled = false;
        }
    } else {
        console.log('Running in browser - ads disabled');
        adsEnabled = false;
    }
}

// ============================================
// REWARDED AD FUNCTIONS
// ============================================

let rewardedAdReady = false;
let pendingRewardCallback = null;
let rewardType = '';

function prepareRewardedAd() {
    if (typeof AdMob === 'undefined') {
        console.log('AdMob not available - skipping rewarded ad');
        return;
    }
    
    try {
        AdMob.prepareRewardedVideoAd({
            adId: REWARDED_AD_ID,
            isTesting: false
        });
        
        AdMob.on('admob.rewarded.events.LOAD', () => {
            rewardedAdReady = true;
            console.log('Rewarded ad loaded and ready');
        });
        
        AdMob.on('admob.rewarded.events.REWARD', (reward) => {
            console.log('User earned reward:', reward.amount, reward.type);
            if (pendingRewardCallback) {
                pendingRewardCallback();
                pendingRewardCallback = null;
            }
        });
        
        AdMob.on('admob.rewarded.events.CLOSE', () => {
            rewardedAdReady = false;
            prepareRewardedAd();
        });
    } catch (error) {
        console.log('Rewarded ad error:', error);
    }
}

function showRewardedAd(callback, type) {
    if (!adsEnabled || typeof AdMob === 'undefined') {
        if (callback) callback();
        return;
    }
    
    if (adInProgress) {
        console.log('Ad already in progress');
        return;
    }
    
    if (!rewardedAdReady) {
        console.log('Rewarded ad not ready, preparing...');
        prepareRewardedAd();
        setTimeout(() => {
            if (callback) callback();
        }, 1000);
        return;
    }
    
    adInProgress = true;
    pendingRewardCallback = callback;
    rewardType = type;
    
    try {
        AdMob.showRewardedVideoAd();
    } catch (error) {
        console.log('Failed to show rewarded ad:', error);
        adInProgress = false;
        if (callback) callback();
    }
}

setTimeout(prepareRewardedAd, 2000);

function showInterstitialAd() {
    if (!adsEnabled || typeof AdMob === 'undefined') return;
    
    winCounter++;
    
    if (winCounter >= 3 && interstitialReady) {
        try {
            AdMob.showInterstitial();
            winCounter = 0;
        } catch (error) {
            console.log('Failed to show interstitial:', error);
        }
    }
}

setTimeout(initializeAds, 1500);

// ============================================
// AVATAR SYSTEM
// ============================================

const AVAILABLE_AVATARS = [
    '🦊', '🐼', '🐨', '🦁', '🐱', '🐶', '🐰', '🦄',
    '🐧', '🐲', '🦅', '🐺', '🦝', '🐸'
];

let userAvatar = '🦊';

const loadAvatar = () => {
    const saved = localStorage.getItem('gallowspeak_avatar');
    if (saved) {
        userAvatar = saved;
    } else {
        const randomIndex = Math.floor(Math.random() * AVAILABLE_AVATARS.length);
        userAvatar = AVAILABLE_AVATARS[randomIndex];
        localStorage.setItem('gallowspeak_avatar', userAvatar);
    }
    updateAvatarUI();
};

const changeAvatar = () => {
    const currentIndex = AVAILABLE_AVATARS.indexOf(userAvatar);
    const newIndex = (currentIndex + 1) % AVAILABLE_AVATARS.length;
    userAvatar = AVAILABLE_AVATARS[newIndex];
    localStorage.setItem('gallowspeak_avatar', userAvatar);
    updateAvatarUI();
};

const updateAvatarUI = () => {
    const avatarElements = document.querySelectorAll('.avatar-display');
    avatarElements.forEach(el => {
        if (el) el.textContent = userAvatar;
    });
};

// ============================================
// THEME TOGGLE
// ============================================

const loadTheme = () => {
    const savedTheme = localStorage.getItem('gallowspeak_theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcon('dark');
    }
};

const updateThemeIcon = (theme) => {
    const icon = document.getElementById('theme-icon');
    const toggleBtn = document.getElementById('themeToggle');
    if (icon) {
        icon.textContent = theme === 'light' ? '☀️' : '🌙';
    }
    if (toggleBtn) {
        toggleBtn.innerHTML = `<span id="theme-icon">${theme === 'light' ? '☀️' : '🌙'}</span> Theme`;
    }
    if (settingsOpen) {
        updateSettingsUI();
    }
};

const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('gallowspeak_theme', newTheme);
    updateThemeIcon(newTheme);
    
    const bgContainer = document.querySelector('.bg-container');
    if (bgContainer) {
        if (newTheme === 'light') {
            bgContainer.style.filter = 'brightness(1.1) saturate(1.1)';
        } else {
            bgContainer.style.filter = 'none';
        }
    }
};

// ============================================
// SETTINGS SYSTEM
// ============================================

let settingsOpen = false;

const openSettings = () => {
    const modal = document.getElementById('settingsModal');
    if (!modal) {
        console.warn('Settings modal not found in DOM');
        return;
    }
    
    updateSettingsUI();
    modal.classList.add('active');
    settingsOpen = true;
    if (parallaxInstance) parallaxInstance.disable();
};

const closeSettings = () => {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    
    modal.classList.remove('active');
    settingsOpen = false;
    if (parallaxInstance) parallaxInstance.enable();
};

const updateSettingsUI = () => {
    const avatarDisplay = document.getElementById('settingsAvatar');
    if (avatarDisplay) avatarDisplay.textContent = userAvatar;
    
    const soundStatus = document.getElementById('soundStatus');
    const soundThumb = document.getElementById('soundToggleThumb');
    if (soundStatus) soundStatus.textContent = allowAudio ? 'On' : 'Off';
    if (soundThumb) {
        soundThumb.classList.toggle('active', allowAudio);
        const track = soundThumb.parentElement;
        if (track) track.classList.toggle('active', allowAudio);
    }
    
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const themeStatus = document.getElementById('themeStatus');
    const themeThumb = document.getElementById('themeToggleThumb');
    if (themeStatus) themeStatus.textContent = currentTheme === 'light' ? 'Light' : 'Dark';
    if (themeThumb) {
        themeThumb.classList.toggle('active', currentTheme === 'light');
        const track = themeThumb.parentElement;
        if (track) track.classList.toggle('active', currentTheme === 'light');
    }
    
    const progressLevel = document.getElementById('progressLevel');
    if (progressLevel && gameStats) progressLevel.textContent = `Level ${gameStats.level || 1}`;
    
    const progressCoins = document.getElementById('progressCoins');
    if (progressCoins && gameStats) progressCoins.textContent = `🪙 ${gameStats.totalCoins || 0}`;
    
    const progressDiamonds = document.getElementById('progressDiamonds');
    if (progressDiamonds && gameStats) progressDiamonds.textContent = `💎 ${gameStats.totalDiamonds || 0}`;
    
    const progressStreak = document.getElementById('progressStreak');
    if (progressStreak && streakData) progressStreak.textContent = `🔥 ${streakData.currentStreak || 0}d`;
};

// ============================================
// LANDING PAGE
// ============================================

const showLandingPage = () => {
    console.log('Showing landing page...');
    
    const existing = document.getElementById('landingOverlay');
    if (existing) {
        existing.remove();
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'landing-overlay';
    overlay.id = 'landingOverlay';
    overlay.innerHTML = `
        <div class="landing-content">
            <div class="landing-logo">
                <svg viewBox="0 0 200 200" class="landing-logo-svg">
                    <rect x="50" y="30" width="8" height="120" fill="#520ca1" rx="2"/>
                    <rect x="50" y="30" width="80" height="8" fill="#520ca1" rx="2"/>
                    <line x1="130" y1="30" x2="130" y2="55" stroke="#520ca1" stroke-width="6" stroke-linecap="round"/>
                    <path d="M130 55 Q130 75 120 85" stroke="#e6d439" stroke-width="3" fill="none"/>
                    <ellipse cx="118" cy="88" rx="8" ry="4" stroke="#e6d439" stroke-width="3" fill="none"/>
                    <rect x="155" y="45" width="22" height="22" rx="4" fill="#e6d439" opacity="0.8"/>
                    <text x="166" y="61" font-size="14" font-weight="bold" fill="#110320" text-anchor="middle" font-family="Arial">G</text>
                    <rect x="155" y="70" width="22" height="22" rx="4" fill="#e6d439" opacity="0.6"/>
                    <text x="166" y="86" font-size="14" font-weight="bold" fill="#110320" text-anchor="middle" font-family="Arial">A</text>
                    <rect x="155" y="95" width="22" height="22" rx="4" fill="#e6d439" opacity="0.4"/>
                    <text x="166" y="111" font-size="14" font-weight="bold" fill="#110320" text-anchor="middle" font-family="Arial">M</text>
                    <rect x="155" y="120" width="22" height="22" rx="4" fill="#e6d439" opacity="0.2"/>
                    <text x="166" y="136" font-size="14" font-weight="bold" fill="#110320" text-anchor="middle" font-family="Arial">E</text>
                </svg>
            </div>
            <div class="landing-title">GallowsPeak</div>
            <div class="landing-subtitle">🗡️ Guess the Word • Clear the Level</div>
            <div class="landing-avatar-container">
                <div class="landing-avatar avatar-display" id="landingAvatar">${userAvatar}</div>
                <button class="landing-change-avatar" id="landingChangeAvatar">🔄</button>
            </div>
            <button class="landing-play-btn" id="landingPlayBtn">▶ Play</button>
            <div class="landing-footer">
                <span>🔥 Daily Streaks</span>
                <span>🪙 Coins</span>
                <span>💎 Diamonds</span>
            </div>
            <button class="landing-settings-btn" id="landingSettingsBtn">⚙️ Settings</button>
            <div class="landing-version">v1.0.0</div>
        </div>
    `;
    
    document.body.prepend(overlay);
    
    // Event Listeners
    document.getElementById('landingPlayBtn').addEventListener('click', function(e) {
        e.stopPropagation();
        console.log('Play button clicked!');
        const overlay = document.getElementById('landingOverlay');
        if (overlay) {
            overlay.style.transition = 'opacity 0.3s';
            overlay.style.opacity = '0';
            setTimeout(function() {
                overlay.style.display = 'none';
                // Check if tutorial should show
                if (localStorage.getItem('tutorial_shown') === 'true') {
                    // Tutorial already shown, show menu directly
                    showMenu();
                } else {
                    // First launch - show tutorial first, then menu
                    showTutorialAndMenu();
                }
            }, 300);
        }
    });
    
    document.getElementById('landingSettingsBtn').addEventListener('click', function(e) {
        e.stopPropagation();
        console.log('Settings button clicked!');
        openSettings();
    });
    
    document.getElementById('landingChangeAvatar').addEventListener('click', function(e) {
        e.stopPropagation();
        console.log('Avatar button clicked!');
        changeAvatar();
        const avatarDisplay = document.querySelector('.landing-avatar');
        if (avatarDisplay) {
            avatarDisplay.textContent = userAvatar;
        }
    });
    
    const avatarDisplay = document.querySelector('.landing-avatar');
    if (avatarDisplay) {
        avatarDisplay.textContent = userAvatar;
    }
    
    console.log('Landing page setup complete');
};

// ============================================
// PREMIUM TUTORIAL - Shows ONLY ONCE
// ============================================

const showTutorialAndMenu = () => {
    console.log('Showing premium tutorial for first time...');
    
    // Create tutorial overlay
    const overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay premium-tutorial';
    overlay.id = 'tutorialOverlay';
    
    overlay.innerHTML = `
        <div class="tutorial-container">
            <div class="tutorial-header">
                <div class="tutorial-progress">
                    <span class="tutorial-step-indicator active" data-step="1"></span>
                    <span class="tutorial-step-indicator" data-step="2"></span>
                    <span class="tutorial-step-indicator" data-step="3"></span>
                    <span class="tutorial-step-indicator" data-step="4"></span>
                </div>
                <button class="tutorial-skip" id="tutorialSkip">Skip ✕</button>
            </div>
            <div class="tutorial-body">
                <div class="tutorial-slide active" data-step="1">
                    <div class="tutorial-icon-wrapper">🔤</div>
                    <h2>Guess the Word</h2>
                    <p>Tap letters to uncover the hidden word. Each correct guess reveals a letter!</p>
                    <div class="tutorial-example">
                        <span class="tutorial-letter">_</span>
                        <span class="tutorial-letter">_</span>
                        <span class="tutorial-letter">A</span>
                        <span class="tutorial-letter">_</span>
                        <span class="tutorial-letter">_</span>
                    </div>
                </div>
                <div class="tutorial-slide" data-step="2">
                    <div class="tutorial-icon-wrapper">🏆</div>
                    <h2>Clear Levels</h2>
                    <p>Complete <strong>3 words</strong> to advance to the next level. Each level gets tougher!</p>
                    <div class="tutorial-example">
                        <span class="tutorial-level">Level 1</span>
                        <span class="tutorial-arrow">→</span>
                        <span class="tutorial-level">Level 2</span>
                        <span class="tutorial-arrow">→</span>
                        <span class="tutorial-level">Level 3</span>
                    </div>
                </div>
                <div class="tutorial-slide" data-step="3">
                    <div class="tutorial-icon-wrapper">🪙</div>
                    <h2>Earn Rewards</h2>
                    <p>Get <strong>🪙 10 coins</strong> per word and <strong>🪙 30 bonus coins</strong> for each level cleared!</p>
                    <div class="tutorial-example">
                        <span class="tutorial-reward">+10 🪙</span>
                        <span class="tutorial-reward">+30 🪙</span>
                        <span class="tutorial-reward">💎 Diamonds</span>
                    </div>
                </div>
                <div class="tutorial-slide" data-step="4">
                    <div class="tutorial-icon-wrapper">🔥</div>
                    <h2>Daily Streaks</h2>
                    <p>Play every day to build your streak. <strong>3-day</strong> streaks give bonus coins!</p>
                    <div class="tutorial-example">
                        <span class="tutorial-streak">🔥 1d</span>
                        <span class="tutorial-streak">🔥 2d</span>
                        <span class="tutorial-streak">🔥 3d ⭐</span>
                    </div>
                </div>
            </div>
            <div class="tutorial-footer">
                <button class="tutorial-prev" id="tutorialPrev">‹ Back</button>
                <span class="tutorial-counter" id="tutorialCounter">1 / 4</span>
                <button class="tutorial-next" id="tutorialNext">Next ›</button>
                <button class="tutorial-got-it" id="tutorialGotIt" style="display: none;">🎯 Got it!</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Tutorial state
    let currentStep = 1;
    const totalSteps = 4;
    
    const updateTutorial = () => {
        // Update slides
        document.querySelectorAll('.tutorial-slide').forEach(slide => {
            slide.classList.toggle('active', parseInt(slide.dataset.step) === currentStep);
        });
        
        // Update progress indicators
        document.querySelectorAll('.tutorial-step-indicator').forEach(indicator => {
            const step = parseInt(indicator.dataset.step);
            indicator.classList.toggle('active', step <= currentStep);
            indicator.classList.toggle('completed', step < currentStep);
        });
        
        // Update counter
        const counter = document.getElementById('tutorialCounter');
        if (counter) counter.textContent = `${currentStep} / ${totalSteps}`;
        
        // Update buttons
        const prevBtn = document.getElementById('tutorialPrev');
        const nextBtn = document.getElementById('tutorialNext');
        const gotItBtn = document.getElementById('tutorialGotIt');
        
        if (prevBtn) prevBtn.style.display = currentStep === 1 ? 'none' : 'inline-block';
        if (nextBtn) nextBtn.style.display = currentStep === totalSteps ? 'none' : 'inline-block';
        if (gotItBtn) gotItBtn.style.display = currentStep === totalSteps ? 'inline-block' : 'none';
    };
    
    // Event listeners
    document.getElementById('tutorialNext').addEventListener('click', function() {
        if (currentStep < totalSteps) {
            currentStep++;
            updateTutorial();
        }
    });
    
    document.getElementById('tutorialPrev').addEventListener('click', function() {
        if (currentStep > 1) {
            currentStep--;
            updateTutorial();
        }
    });
    
    document.getElementById('tutorialGotIt').addEventListener('click', function() {
        closeTutorial();
    });
    
    document.getElementById('tutorialSkip').addEventListener('click', function() {
        if (confirm('Skip tutorial? You can always replay it later.')) {
            closeTutorial();
        }
    });
    
    const closeTutorial = () => {
        const overlay = document.getElementById('tutorialOverlay');
        if (overlay) {
            overlay.style.transition = 'opacity 0.3s, transform 0.3s';
            overlay.style.opacity = '0';
            overlay.style.transform = 'scale(0.95)';
            setTimeout(function() {
                overlay.remove();
                localStorage.setItem('tutorial_shown', 'true');
                console.log('Tutorial completed and marked as shown');
                // Show menu after tutorial
                showMenu();
            }, 300);
        }
    };
    
    // Initialize tutorial
    updateTutorial();
};

// ============================================
// DAILY STREAK SYSTEM
// ============================================

let streakData = {
    currentStreak: 0,
    bestStreak: 0,
    lastPlayedDate: null,
    dailyRewardClaimed: false,
    totalCoins: 100,
    totalDiamonds: 10
};

const loadStreakData = () => {
    const saved = localStorage.getItem('gallowspeak_streak_data');
    if (saved) {
        try {
            streakData = JSON.parse(saved);
        } catch (e) {
            console.log('Error loading streak data:', e);
        }
    } else {
        saveStreakData();
    }
};

const saveStreakData = () => {
    localStorage.setItem('gallowspeak_streak_data', JSON.stringify(streakData));
};

const updateStreak = () => {
    const today = new Date().toDateString();
    const lastPlayed = streakData.lastPlayedDate ? new Date(streakData.lastPlayedDate).toDateString() : null;
    
    if (lastPlayed === today) {
        console.log(`Streak: ${streakData.currentStreak} days (already played today)`);
        return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (lastPlayed === yesterdayStr) {
        streakData.currentStreak += 1;
        if (streakData.currentStreak > streakData.bestStreak) {
            streakData.bestStreak = streakData.currentStreak;
        }
        streakData.lastPlayedDate = new Date().toISOString();
        
        let bonusCoins = 0;
        let bonusDiamonds = 0;
        let bonusMessage = '';
        
        if (streakData.currentStreak >= 30) {
            bonusCoins = 200;
            bonusDiamonds = 20;
            bonusMessage = `🏆 30-Day Streak! +200 Coins & +20 Diamonds!`;
        } else if (streakData.currentStreak >= 14) {
            bonusCoins = 100;
            bonusDiamonds = 10;
            bonusMessage = `⭐ 14-Day Streak! +100 Coins & +10 Diamonds!`;
        } else if (streakData.currentStreak >= 7) {
            bonusCoins = 50;
            bonusMessage = `🔥 7-Day Streak! +50 Coins!`;
        } else if (streakData.currentStreak >= 3) {
            bonusCoins = 20;
            bonusMessage = `🌟 3-Day Streak! +20 Coins!`;
        }
        
        if (bonusCoins > 0 || bonusDiamonds > 0) {
            streakData.totalCoins += bonusCoins;
            streakData.totalDiamonds += bonusDiamonds;
            showStreakBonus(bonusMessage);
        }
        
        saveStreakData();
        console.log(`Streak increased to: ${streakData.currentStreak} days`);
    } else if (lastPlayed !== today && lastPlayed !== yesterdayStr) {
        if (streakData.totalDiamonds >= 5 && streakData.currentStreak > 0) {
            streakData.totalDiamonds -= 5;
            streakData.lastPlayedDate = new Date().toISOString();
            showStreakBonus(`🛡️ Streak Freeze Used! (-5 Diamonds)`);
            console.log('Streak freeze used!');
        } else {
            streakData.currentStreak = 1;
            streakData.lastPlayedDate = new Date().toISOString();
            console.log('Streak reset to 1');
        }
        saveStreakData();
    }
    
    updateStatsUI();
};

const showStreakBonus = (message) => {
    const notification = document.createElement('div');
    notification.className = 'streak-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(17, 3, 32, 0.95);
        color: white;
        padding: 20px 30px;
        border-radius: 15px;
        z-index: 9999;
        font-size: 1.2rem;
        text-align: center;
        border: 2px solid var(--second-button-color);
        box-shadow: 0 10px 40px rgba(0,0,0,0.8);
        max-width: 90%;
        animation: streakPop 3s ease-in-out forwards;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
};

// ============================================
// COINS, DIAMONDS & LEVEL SYSTEM
// ============================================

let gameStats = {
    level: 1,
    levelProgress: 0,
    totalCoins: 100,
    totalDiamonds: 10,
    levelsCompleted: 0,
    wordsCleared: 0,
    totalWordsCleared: 0
};

let currentCorrectWord = '';

const loadGameStats = () => {
    const saved = localStorage.getItem('gallowspeak_game_stats');
    if (saved) {
        try {
            gameStats = JSON.parse(saved);
            if (gameStats.totalCoins === undefined) gameStats.totalCoins = 100;
            if (gameStats.totalDiamonds === undefined) gameStats.totalDiamonds = 10;
        } catch (e) {
            console.log('Error loading game stats:', e);
        }
    } else {
        gameStats.totalCoins = 100;
        gameStats.totalDiamonds = 10;
        saveGameStats();
    }
    streakData.totalCoins = gameStats.totalCoins;
    streakData.totalDiamonds = gameStats.totalDiamonds;
};

const saveGameStats = () => {
    localStorage.setItem('gallowspeak_game_stats', JSON.stringify(gameStats));
    streakData.totalCoins = gameStats.totalCoins;
    streakData.totalDiamonds = gameStats.totalDiamonds;
    saveStreakData();
};

const onWordCleared = () => {
    gameStats.levelProgress += 1;
    gameStats.wordsCleared += 1;
    gameStats.totalWordsCleared += 1;
    
    const wordBonus = 10;
    gameStats.totalCoins += wordBonus;
    
    if (gameStats.levelProgress >= 3) {
        gameStats.level += 1;
        gameStats.levelProgress = 0;
        gameStats.levelsCompleted += 1;
        
        const levelBonusCoins = 30;
        gameStats.totalCoins += levelBonusCoins;
        
        if (gameStats.levelsCompleted % 5 === 0) {
            const clusterBonusDiamonds = 10;
            gameStats.totalDiamonds += clusterBonusDiamonds;
            showClusterComplete();
        }
        
        streakData.totalCoins = gameStats.totalCoins;
        streakData.totalDiamonds = gameStats.totalDiamonds;
        saveGameStats();
        saveStreakData();
        updateStatsUI();
        
        showLevelComplete();
        return true;
    }
    
    saveGameStats();
    updateStatsUI();
    return false;
};

// ============================================
// IMPROVED POPUPS
// ============================================

let levelCoinsEarned = 0;
let isLevelFailed = false;

const showLevelComplete = () => {
    const modal = document.querySelector('.gameover-modal');
    if (!modal) return;
    
    const box = modal.querySelector('.gameover-box');
    const content = modal.querySelector('.gameover-content');
    const title = modal.querySelector('.text');
    const data = modal.querySelector('.gameover-data');
    const buttons = modal.querySelector('.buttons');
    
    buttons.innerHTML = '';
    levelCoinsEarned = 30;
    
    title.textContent = '🎉 LEVEL CLEAR!';
    
    data.innerHTML = `
        <div class="level-info" style="text-align: center; width: 100%;">
            <div style="font-size: 1.8rem; color: var(--second-button-color); font-weight: bold;">
                ${gameStats.level - 1} ➜ ${gameStats.level}
            </div>
            <div style="display: flex; justify-content: space-around; width: 100%; margin-top: 15px; font-size: 1.1rem;">
                <div>🪙 <span style="color: var(--second-button-color);">+${levelCoinsEarned}</span></div>
                <div>📊 ${gameStats.totalWordsCleared} words</div>
                <div>💎 <span style="color: gold;">${gameStats.totalDiamonds}</span></div>
            </div>
            <div style="margin-top: 10px; font-size: 0.9rem; opacity: 0.6;">
                Total Coins: 🪙 ${gameStats.totalCoins}
            </div>
        </div>
    `;
    
    buttons.style.width = '90%';
    buttons.style.display = 'flex';
    buttons.style.flexDirection = 'row';
    buttons.style.justifyContent = 'center';
    buttons.style.gap = '10px';
    buttons.style.marginTop = '15px';
    
    const menuBtn = document.createElement('button');
    menuBtn.className = 'menu-button';
    menuBtn.style.cssText = `
        flex: 1;
        min-width: 80px;
        height: 45px;
        font-size: 0.9rem;
        background: var(--dark-main-color);
        color: white;
        border: 2px solid var(--main-button-color);
        border-radius: 10px;
        cursor: pointer;
        font-weight: bold;
    `;
    menuBtn.textContent = '🏠 Menu';
    menuBtn.addEventListener('click', () => {
        closeLevelPopup();
        showMenu();
    });
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'menu-button';
    nextBtn.style.cssText = `
        flex: 2;
        min-width: 120px;
        height: 45px;
        font-size: 1rem;
        background: var(--second-button-color);
        color: var(--dark-main-color);
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    `;
    nextBtn.innerHTML = `▶ Next  +🪙${levelCoinsEarned}`;
    nextBtn.addEventListener('click', () => {
        closeLevelPopup();
        continueToNextLevel();
    });
    
    const doubleBtn = document.createElement('button');
    doubleBtn.className = 'menu-button';
    doubleBtn.style.cssText = `
        flex: 2;
        min-width: 120px;
        height: 45px;
        font-size: 0.9rem;
        background: linear-gradient(135deg, #f7971e, #ffd200);
        color: var(--dark-main-color);
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    `;
    doubleBtn.innerHTML = `🎬 Double 🪙 (20s)`;
    doubleBtn.addEventListener('click', () => {
        doubleBtn.disabled = true;
        doubleBtn.textContent = '⏳ Loading...';
        showRewardedAd(() => {
            const doubledCoins = levelCoinsEarned;
            gameStats.totalCoins += doubledCoins;
            saveGameStats();
            updateStatsUI();
            levelCoinsEarned *= 2;
            doubleBtn.textContent = `✅ +${doubledCoins} 🪙`;
            doubleBtn.style.background = '#37b666';
            doubleBtn.style.color = 'white';
            nextBtn.innerHTML = `▶ Next  +🪙${levelCoinsEarned}`;
            const coinDisplay = data.querySelector('.level-info div:first-child');
            if (coinDisplay) {
                coinDisplay.innerHTML = `🪙 +${levelCoinsEarned} coins!`;
            }
            doubleBtn.disabled = false;
            adInProgress = false;
        }, 'double_coins');
    });
    
    buttons.appendChild(menuBtn);
    buttons.appendChild(nextBtn);
    buttons.appendChild(doubleBtn);
    
    modal.style.visibility = 'visible';
    modal.style.opacity = '0';
    box.style.transform = 'scale(0.8)';
    
    gsap.to(modal, { opacity: 1, duration: 0.3 });
    gsap.to(box, { scale: 1, duration: 0.4, ease: 'back.out(1.7)' });
    
    if (parallaxInstance) parallaxInstance.disable();
    isLevelFailed = false;
};

const showLevelFailed = (correctWord) => {
    const modal = document.querySelector('.gameover-modal');
    if (!modal) return;
    
    const box = modal.querySelector('.gameover-box');
    const content = modal.querySelector('.gameover-content');
    const title = modal.querySelector('.text');
    const data = modal.querySelector('.gameover-data');
    const buttons = modal.querySelector('.buttons');
    
    buttons.innerHTML = '';
    
    title.textContent = '😢 LEVEL FAILED';
    
    data.innerHTML = `
        <div class="level-info" style="text-align: center; width: 100%;">
            <div style="font-size: 1.5rem; color: #ff6b6b; font-weight: bold; margin-bottom: 10px;">
                The word was:
            </div>
            <div class="correct-word">
                ${correctWord.toUpperCase()}
            </div>
            <div style="display: flex; justify-content: space-around; width: 100%; margin-top: 15px; font-size: 1rem;">
                <div>🪙 <span style="color: var(--second-button-color);">${gameStats.totalCoins}</span></div>
                <div>📊 ${gameStats.totalWordsCleared} words</div>
                <div>💎 <span style="color: gold;">${gameStats.totalDiamonds}</span></div>
            </div>
        </div>
    `;
    
    buttons.style.width = '90%';
    buttons.style.display = 'flex';
    buttons.style.flexDirection = 'row';
    buttons.style.justifyContent = 'center';
    buttons.style.gap = '10px';
    buttons.style.marginTop = '15px';
    
    const menuBtn = document.createElement('button');
    menuBtn.className = 'menu-button';
    menuBtn.style.cssText = `
        flex: 1;
        min-width: 80px;
        height: 45px;
        font-size: 0.9rem;
        background: var(--dark-main-color);
        color: white;
        border: 2px solid var(--main-button-color);
        border-radius: 10px;
        cursor: pointer;
        font-weight: bold;
    `;
    menuBtn.textContent = '🏠 Menu';
    menuBtn.addEventListener('click', () => {
        closeLevelPopup();
        showMenu();
    });
    
    const retryBtn = document.createElement('button');
    retryBtn.className = 'menu-button';
    retryBtn.style.cssText = `
        flex: 2;
        min-width: 120px;
        height: 45px;
        font-size: 1rem;
        background: linear-gradient(135deg, #4a00e0, #8e2de2);
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    `;
    retryBtn.innerHTML = `🎬 Try Again (15s)`;
    retryBtn.addEventListener('click', () => {
        retryBtn.disabled = true;
        retryBtn.textContent = '⏳ Loading...';
        showRewardedAd(() => {
            closeLevelPopup();
            resetCurrentLevel();
            retryBtn.disabled = false;
            adInProgress = false;
        }, 'retry_level');
    });
    
    buttons.appendChild(menuBtn);
    buttons.appendChild(retryBtn);
    
    modal.style.visibility = 'visible';
    modal.style.opacity = '0';
    box.style.transform = 'scale(0.8)';
    
    gsap.to(modal, { opacity: 1, duration: 0.3 });
    gsap.to(box, { scale: 1, duration: 0.4, ease: 'back.out(1.7)' });
    
    if (parallaxInstance) parallaxInstance.disable();
    isLevelFailed = true;
};

const closeLevelPopup = () => {
    const modal = document.querySelector('.gameover-modal');
    const box = modal.querySelector('.gameover-box');
    
    gsap.to(box, { scale: 0.8, duration: 0.2 });
    gsap.to(modal, { 
        opacity: 0, 
        duration: 0.2,
        onComplete: () => {
            modal.style.visibility = 'collapse';
        }
    });
    if (parallaxInstance) parallaxInstance.enable();
    updateStatsUI();
};

const continueToNextLevel = () => {
    words.length = 0;
    const savedData = sessionStorage.getItem('currentData');
    if (savedData) {
        words = JSON.parse(savedData);
    }
    setupGame();
    hideLetters(wordArray);
    createLetterElements(wordArray);
    enableAllButtons();
    updateStatsUI();
};

const resetCurrentLevel = () => {
    const word = currentCorrectWord;
    if (word) {
        wordArray = word.toUpperCase().split('');
        hidden = {};
        clearPrevWord(true);
        hideLetters(wordArray);
        createLetterElements(wordArray);
        resetGuesses();
        enableAllButtons();
        updateStatsUI();
    } else {
        setupGame();
        hideLetters(wordArray);
        createLetterElements(wordArray);
        enableAllButtons();
    }
};

const showClusterComplete = () => {
    showStreakBonus(`💎 Cluster Complete! +10 Diamonds! 💎`);
};

// ============================================
// ORIGINAL GAME CODE
// ============================================

const scene = document.querySelector("#scene");
const parallaxInstance = new Parallax(scene);
const alphaContainer = document.querySelector(".alpha-container");
const wordContainer = document.querySelector(".word-container");
const modal = document.querySelector(".modal");
const menuBox = document.querySelector(".modal-content");
const mainContent = document.querySelector(".main-content");
const body = document.querySelector("body");
const guessesSpan = document.querySelector(".guesses-left span");
const scoreSpan = document.querySelector(".score span");
const bestScoreSpan = document.querySelector(".best-score span");
const diffSpan = document.querySelector(".category span:nth-child(2)");
const catSpan = document.querySelector(".category span");
const wordUrl = "https://api.datamuse.com/words?rel_trg=";
const pokeUrl = "https://pokeapi.co/api/v2/pokemon/?limit=200";
let words = [];
let data = undefined;
let current = 0;
let wordArray;
let hidden = {};
let nextButton;
let guesses = 5;
let score = 0;
let bestScore = 0;
let category = "food";
let queryParam = category;
let diffValues = {
    easy: 0.4,
    medium: 0.7,
    hard: 1.3,
};
let difficulty = "medium";
const alphabet = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
    "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
];

const updateCurrent = () => {
    current = Math.floor(Math.random() * words.length);
};

const getRandomWord = () => {
    if (words.length > 0) {
        let currentWord = words[current].toUpperCase().split("");
        currentCorrectWord = currentWord.join('');
        words.splice(current, 1);
        return currentWord;
    } else {
        console.warn("Words array is empty, using fallback word");
        currentCorrectWord = 'HANGMAN';
        return "HANGMAN".split("");
    }
};

const reduceGuesses = () => {
    if (guesses > 0) guesses--;
    guessesSpan.innerText = `${guesses}/5`;
};

const resetGuesses = () => {
    guesses = 5;
    guessesSpan.innerText = `${guesses}/5`;
};

const increaseScore = (val) => {
    score += val;
    scoreSpan.innerText = score;
};

const resetScore = () => {
    score = 0;
    scoreSpan.innerText = score;
};

const updateBestScore = () => {
    if (score > bestScore) {
        bestScore = score;
        bestScoreSpan.innerText = bestScore;
        localStorage.setItem("hangmanBestScore", bestScore);
    }
};

const loadSavedBestScore = () => {
    const savedBest = localStorage.getItem("hangmanBestScore");
    if (savedBest !== null) {
        bestScore = parseInt(savedBest);
        bestScoreSpan.innerText = bestScore;
    }
};

mobileAndTabletCheck = () => {
    let check = false;
    ((a) => {
        if (
            /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
                a
            ) ||
            /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
                a.substr(0, 4)
            )
        )
            check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};

const disableAllButtons = () => {
    let buttons = document.querySelectorAll("main button");
    buttons.forEach((button) => {
        if (!button.classList.contains("sound-button")) button.disabled = true;
    });
};

const enableAllButtons = () => {
    let buttons = document.querySelectorAll("main button");
    buttons.forEach((button) => {
        if (!button.classList.contains("next-button") && !button.classList.contains("sound-button"))
            button.disabled = false;
    });
};

// Creating alphabet buttons
alphabet.forEach((letter) => {
    let button = document.createElement("button");
    button.className = "letter";
    button.id = `letter-${letter}`;
    button.value = letter;
    button.innerText = letter;
    
    const handleLetterClick = () => {
        if (button.disabled) return;
        button.disabled = true;
        button.style.opacity = "0.6";
        checkAnswer(button.innerText);
    };
    
    button.addEventListener("click", handleLetterClick);
    button.addEventListener("touchstart", (e) => {
        e.preventDefault();
        button.style.transform = "scale(0.95)";
        handleLetterClick();
    });
    button.addEventListener("touchend", () => {
        button.style.transform = "scale(1)";
    });
    
    alphaContainer.append(button);
});

const alphaButtons = document.querySelectorAll("button.letter");

const fadeOut = {
    keyframes: [{ transform: "translateX(0)", opacity: 1 }, { transform: "translateX(-20%)", opacity: 0 }],
    opts: { fill: "forwards", duration: 300 }
};

const fadeIn = {
    keyframes: [{ transform: "translateX(20%)", opacity: 0 }, { transform: "translateX(0)", opacity: 1 }],
    opts: { fill: "forwards", duration: 300 }
};

const appear = {
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
    opts: { duration: 300, fill: "forwards", easing: "linear", delay: 500 }
};

const disappear = {
    keyframes: [{ opacity: 1 }, { opacity: 0 }],
    opts: { duration: 300, fill: "forwards", easing: "linear" }
};

let xDown = null;
let yDown = null;
let swipped = false;

const handleTouchStart = (e) => {
    xDown = e.touches[0].clientX;
    yDown = e.touches[0].clientY;
};

const handleTouchMove = (e) => {
    if (!xDown || !yDown) return;
    let xUp = e.touches[0].clientX;
    let yUp = e.touches[0].clientY;
    let xDiff = xDown - xUp;
    let yDiff = yDown - yUp;
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (xDiff > 0) {
            swipped = true;
        }
    }
};

const handleTouchEnd = () => {
    if (!swipped) return;
    document.querySelector("body").classList.toggle("swipe");
    wordContainer.animate(fadeOut.keyframes, fadeOut.opts);
    setTimeout(() => nextWord(true), 300);
    resetGuesses();
    if (typeof resetCanvas === 'function') resetCanvas();
    document.removeEventListener("touchstart", handleTouchStart);
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
    xDown = null;
    yDown = null;
    swipped = false;
};

const disable = (button) => {
    if (!button.disabled) button.disabled = true;
};

const toggleNextButton = () => {
    if (nextButton && nextButton.disabled) {
        nextButton.disabled = false;
        nextButton.style.visibility = "visible";
        nextButton.animate(appear.keyframes, appear.opts);
    } else if (nextButton) {
        nextButton.animate(disappear.keyframes, disappear.opts);
        nextButton.disabled = true;
        nextButton.style.visibility = "hidden";
    }
};

const svg = document.querySelector("#nextIcon");
let startScene = gsap.timeline({
    defaults: { duration: 2 },
    onComplete: () => {
        if (parallaxInstance) parallaxInstance.enable();
    },
});
let nextButtonTl = gsap.timeline({ repeat: -1, yoyo: true });
nextButtonTl.to(svg, { x: 20, duration: 0.5, ease: "none" });
nextButtonTl.pause().progress(0);

const CreateNextButton = () => {
    if (!nextButton) {
        nextButton = document.createElement("button");
        nextButton.className = "next-button";
        nextButton.append(svg);
        nextButton.addEventListener("pointerenter", () => {
            nextButtonTl.pause();
            gsap.timeline().to(svg, { x: 0, duration: 0.15 });
        });
        nextButton.addEventListener("pointerleave", () => {
            nextButtonTl.progress(0).play();
        });
        nextButton.addEventListener("click", () => {
            resetGuesses();
            if (typeof resetCanvas === 'function') resetCanvas();
            wordContainer.animate(fadeOut.keyframes, fadeOut.opts);
            setTimeout(nextWord, 300);
            toggleNextButton();
        });
        toggleNextButton();
    }
    nextButtonTl.play();
    wordContainer.append(nextButton);
};

const checkAnswer = (value) => {
    let keys = Object.keys(hidden).filter((k) => hidden[k] === value);
    if (keys.length !== 0) {
        keys.forEach((k) => {
            let span = document.querySelector(`#id-${k}`);
            let cover = document.querySelector(`#cover-${k}`);
            span.innerText = hidden[k];
            delete hidden[k];
            span.style.visibility = "visible";
            cover.style.transform = "scaleY(0)";
            if (allowAudio && correctAudio && correctAudio.play) correctAudio.play();
            increaseScore(10);
            updateBestScore();
            
            if (Object.keys(hidden).length === 0 && hidden.constructor === Object) {
                let boxes = document.querySelectorAll("li.letter");
                boxes.forEach((box) => {
                    if (!box.classList.contains("hyphen"))
                        box.style.border = "2px solid #37b666";
                });
                wordContainer.animate(
                    [{ transform: "scale(1)" }, { transform: "scale(1.06)" }],
                    { duration: 250, iterations: 2, direction: "alternate" }
                );
                if (allowAudio && winAudio && winAudio.play) winAudio.play();
                updateCurrent();
                
                const levelCompleted = onWordCleared();
                
                if (levelCompleted) {
                    disableAllButtons();
                    return;
                }
                
                showInterstitialAd();
                
                if (mobileAndTabletCheck()) {
                    document.querySelector("body").classList.toggle("swipe");
                    document.addEventListener("touchstart", handleTouchStart, false);
                    document.addEventListener("touchmove", handleTouchMove, false);
                    document.addEventListener("touchend", handleTouchEnd, false);
                } else {
                    toggleNextButton();
                }
            }
        });
    } else {
        let button = document.getElementById(`letter-${value}`);
        if (button) {
            button.style.border = "1px solid red";
            button.classList.add('shake');
            setTimeout(() => button.classList.remove('shake'), 500);
        }
        if (allowAudio && wrongAudio && wrongAudio.play) {
            wrongAudio.volume = 0.2;
            wrongAudio.play();
        }
        reduceGuesses();
        if (typeof pullUp === 'function') pullUp();
        if (guesses === 0) {
            disableAllButtons();
            if (nextButton) nextButton.disabled = true;
            if (allowAudio && loseAudio && loseAudio.play) {
                loseAudio.volume = 0.2;
                loseAudio.play();
            }
            
            const correctWord = currentCorrectWord;
            currentCorrectWord = '';
            
            setTimeout(() => {
                showLevelFailed(correctWord);
            }, 1000);
        }
    }
};

const hideLetters = (wordArray) => {
    let maxHidden = Math.floor(wordArray.length * diffValues[difficulty]);
    for (let i = 0; i < maxHidden; i++) {
        let ran = Math.floor(Math.random() * wordArray.length);
        if (wordArray[ran] !== "" && wordArray[ran] !== " ") {
            hidden[ran] = wordArray[ran];
            wordArray[ran] = "";
        }
    }
};

const clearPrevWord = (all) => {
    alphaButtons.forEach((button) => {
        button.disabled = false;
        button.style.border = "none";
        button.style.opacity = "1";
        button.style.transform = "scale(1)";
        button.classList.remove('shake');
    });
    if (all && wordContainer.firstChild) {
        while (wordContainer.firstChild) {
            wordContainer.removeChild(wordContainer.lastChild);
        }
        return;
    }
    if (wordContainer.firstChild) {
        while (wordContainer.firstChild.className !== "next-button") {
            wordContainer.removeChild(wordContainer.lastChild);
        }
    }
};

const createLetterElements = (wordArray) => {
    wordArray.forEach((letter, i) => {
        let box = document.createElement("li");
        let cover = document.createElement("div");
        let span = document.createElement("span");
        box.className = "letter";
        cover.className = "cover";
        span.innerText = letter;
        span.id = "id-" + i;
        cover.id = "cover-" + i;
        if (letter === "") {
            cover.style.visibility = "visible";
            span.style.visibility = "collapse";
        }
        if (letter === " ") {
            span.style.borderBottom = "4px solid white";
            box.classList.add("hyphen");
            box.border = "none";
            box.style.backgroundColor = "rgba(0,0,0,0)";
            box.style.boxShadow = "none";
        }
        box.append(span);
        box.append(cover);
        wordContainer.append(box);
    });
    if (!mobileAndTabletCheck()) CreateNextButton();
};

const nextWord = (all) => {
    wordArray = getRandomWord();
    clearPrevWord(all);
    hideLetters(wordArray);
    createLetterElements(wordArray);
    wordContainer.animate(fadeIn.keyframes, fadeIn.opts);
};

let alpha = document.querySelector(".alpha-container");
let word = document.querySelector(".word-container");
let right = document.querySelector(".hill-right");
let mid = document.querySelector(".hill-middle");
let left = document.querySelector(".hill-left");
let mountains = document.querySelector(".mountains");
let city = document.querySelector(".city");

const setupScene = () => {
    if (parallaxInstance) parallaxInstance.disable();
    alpha.style.opacity = 0;
    word.style.opacity = 0;
    alpha.classList.toggle("sliding-up");
    word.classList.toggle("sliding-up");
    alpha.classList.toggle("paused");
    word.classList.toggle("paused");
    gsap.set(right, { scale: 1.4, y: "5%" });
    gsap.set(left, { scale: 1.4, y: "5%" });
    if (mobileAndTabletCheck()) {
        gsap.set(mid, { y: "5%" });
    } else {
        gsap.set(mid, { y: "-6%" });
    }
    gsap.set(mountains, { scale: 1.05, y: "10%" });
    gsap.set(city, { scale: 1.1, y: "5%" });
    startScene
        .to(mountains, { scale: 1, y: 0 }, 0)
        .to(city, { scale: 1, y: 0 }, "<+0.3")
        .to(right, { scale: 1, y: 0 }, 0)
        .to(left, { scale: 1, y: 0 }, "<")
        .to(mid, { y: 0 }, "<");
    startScene.pause().progress(0);
    if (typeof stopAnimate === 'function') stopAnimate();
};
setupScene();

const animateScene = () => {
    if (startScene.paused()) {
        if (typeof animateRope === 'function') animateRope();
        startScene.play();
        alpha.classList.toggle("paused");
        word.classList.toggle("paused");
    }
};

const showMenu = () => {
    console.log('Showing menu...');
    
    const landingOverlay = document.getElementById('landingOverlay');
    if (landingOverlay) {
        landingOverlay.style.display = 'none';
    }
    
    modal.style.visibility = "visible";
    modal.style.opacity = 1;
    menuBox.classList.toggle("expand");
    menuBox.classList.toggle("drop-down");
    mainContent.classList.toggle("blur-out");
    mainContent.classList.toggle("blur-in");
    
    console.log('Menu should be visible now');
};

const closeMenu = () => {
    menuBox.classList.toggle("drop-down");
    menuBox.classList.toggle("expand");
    mainContent.classList.toggle("blur-in");
    mainContent.classList.toggle("blur-out");
    modal.style.opacity = 0;
    setTimeout(() => {
        modal.style.visibility = "collapse";
    }, 600);
};

const fetchData = (endpoint) => {
    return fetch(endpoint)
        .then(
            (response) => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error("Request failed!");
            },
            (networkError) => {
                console.log(networkError);
                return { results: [], words: [] };
            }
        )
        .then((jsonResponse) => {
            return new Promise((resolve) => {
                resolve(jsonResponse);
            });
        });
};

const fillData = (jsonResponse, cat) => {
    if (cat === "pokemons") {
        if (jsonResponse["results"] && jsonResponse["results"].length > 0) {
            jsonResponse["results"].forEach((poke) => {
                words.push(poke.name);
            });
        } else {
            words = ["PIKACHU", "CHARIZARD", "BULBASAUR", "SQUIRTLE", "MEWTWO"];
        }
    } else {
        if (jsonResponse.length > 0) {
            jsonResponse.forEach((obj) => {
                if (obj.word) words.push(obj.word);
            });
        } else {
            const fallbackWords = {
                food: ["PIZZA", "BURGER", "SUSHI", "PASTA", "SALAD"],
                sports: ["SOCCER", "TENNIS", "CRICKET", "HOCKEY", "GOLF"],
                instruments: ["GUITAR", "PIANO", "DRUMS", "VIOLIN", "FLUTE"]
            };
            words = fallbackWords[category] || ["HANGMAN", "GAME", "WORD", "GUESS", "LETTER"];
        }
    }
    sessionStorage.setItem("currentData", JSON.stringify(words));
};

const setupGame = () => {
    clearPrevWord(true);
    updateCurrent();
    resetGuesses();
    resetScore();
    if (typeof resetCanvas === 'function') resetCanvas();
    wordArray = getRandomWord();
    hidden = {};
    nextButton = undefined;
    isLevelFailed = false;
};

const startGame = () => {
    setupGame();
    hideLetters(wordArray);
    createLetterElements(wordArray);
    closeMenu();
    animateScene();
    enableAllButtons();
    alphaButtons.forEach(button => {
        button.disabled = false;
        button.style.opacity = "1";
        button.style.border = "none";
        button.style.transform = "scale(1)";
        button.classList.remove('shake');
    });
    updateStreak();
};

const restartGame = () => {
    const modal = document.querySelector('.gameover-modal');
    gsap
        .to('.gameover-box', {
            duration: 0.25,
            scale: 1.6,
            opacity: 0,
            ease: 'none',
        })
        .then(() => {
            modal.style.visibility = 'collapse';
            words.length = 0;
            const savedData = sessionStorage.getItem('currentData');
            if (savedData) {
                words = JSON.parse(savedData);
            }
            setupGame();
            hideLetters(wordArray);
            createLetterElements(wordArray);
            enableAllButtons();
            if (parallaxInstance) parallaxInstance.enable();
            updateStatsUI();
        });
};

const toggleMenuList = (name) => {
    let list = document.querySelector(`.${name}-list .list`);
    list.classList.toggle("closed-list");
    list.classList.toggle("opened-list");
};

const updateStatsUI = () => {
    let statsContainer = document.querySelector('.stats-container');
    if (!statsContainer) {
        statsContainer = document.createElement('div');
        statsContainer.className = 'stats-container';
        document.body.appendChild(statsContainer);
        
        const stats = ['streak', 'level', 'coins', 'diamonds'];
        stats.forEach(name => {
            const el = document.createElement('div');
            el.id = `stat-${name}`;
            statsContainer.appendChild(el);
        });
    }
    
    const streakEl = document.getElementById('stat-streak');
    if (streakEl) streakEl.textContent = `🔥 ${streakData.currentStreak || 0}d`;
    
    const levelEl = document.getElementById('stat-level');
    if (levelEl) levelEl.textContent = `📚 ${gameStats.level || 1}`;
    
    const coinsEl = document.getElementById('stat-coins');
    if (coinsEl) coinsEl.textContent = `🪙 ${gameStats.totalCoins || 0}`;
    
    const diamondsEl = document.getElementById('stat-diamonds');
    if (diamondsEl) diamondsEl.textContent = `💎 ${gameStats.totalDiamonds || 0}`;
};

let catButton = document.querySelector(".category-button");
let diffButton = document.querySelector(".difficulty-button");
let playButton = document.querySelector(".start-game");

// ============================================
// SETTINGS EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded, attaching settings listeners...');
    
    // Settings close button
    const closeBtn = document.getElementById('settingsClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSettings);
    }
    
    // Click outside to close
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeSettings();
            }
        });
    }
    
    // Avatar change in settings
    const avatarChangeBtn = document.getElementById('settingsChangeAvatar');
    if (avatarChangeBtn) {
        avatarChangeBtn.addEventListener('click', function() {
            changeAvatar();
            updateSettingsUI();
            const landingAvatar = document.querySelector('.landing-avatar');
            if (landingAvatar) landingAvatar.textContent = userAvatar;
        });
    }
    
    // Sound toggle in settings
    const soundToggle = document.getElementById('settingsSoundToggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', function() {
            allowAudio = !allowAudio;
            const soundBtn = document.querySelector('.sound-button');
            if (soundBtn) {
                soundBtn.classList.toggle('disabled', !allowAudio);
            }
            updateSettingsUI();
        });
    }
    
    // Theme toggle in settings
    const themeToggle = document.getElementById('settingsThemeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            toggleTheme();
            updateSettingsUI();
        });
    }
    
    // Reset progress
    const resetBtn = document.getElementById('settingsReset');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            if (confirm('⚠️ Are you sure? This will reset ALL your progress, coins, diamonds, and streak!')) {
                localStorage.removeItem('gallowspeak_streak_data');
                localStorage.removeItem('gallowspeak_game_stats');
                localStorage.removeItem('gallowspeak_best_score');
                localStorage.removeItem('hangmanBestScore');
                
                streakData = {
                    currentStreak: 0,
                    bestStreak: 0,
                    lastPlayedDate: null,
                    dailyRewardClaimed: false,
                    totalCoins: 100,
                    totalDiamonds: 10
                };
                gameStats = {
                    level: 1,
                    levelProgress: 0,
                    totalCoins: 100,
                    totalDiamonds: 10,
                    levelsCompleted: 0,
                    wordsCleared: 0,
                    totalWordsCleared: 0
                };
                
                bestScore = 0;
                if (bestScoreSpan) bestScoreSpan.innerText = '0';
                
                saveGameStats();
                saveStreakData();
                updateStatsUI();
                updateSettingsUI();
                
                setupGame();
                hideLetters(wordArray);
                createLetterElements(wordArray);
                enableAllButtons();
                
                alert('🔄 Progress has been reset! Starting fresh.');
            }
        });
    }
});

// Escape key to close settings
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && settingsOpen) {
        closeSettings();
    }
});

// ============================================
// INITIALIZATION
// ============================================

console.log('Initializing game...');

loadSavedBestScore();
loadAvatar();
loadTheme();
loadGameStats();
loadStreakData();
updateStatsUI();

// Show landing page after a short delay
setTimeout(function() {
    console.log('Showing landing page...');
    showLandingPage();
}, 300);

// ============================================
// MENU BUTTONS
// ============================================

document.querySelector(".start-game").addEventListener("click", function() {
    catButton.disabled = true;
    diffButton.disabled = true;
    playButton.disabled = true;
    playButton.classList.toggle("loading");
    if (queryParam !== category || words.length === 0) {
        words.length = 0;
        queryParam = category;
        let endpoint = `${wordUrl}${queryParam}`;
        if (category === "pokemons") {
            fetchData(pokeUrl).then(function(jsonResponse) {
                playButton.classList.toggle("loading");
                fillData(jsonResponse, "pokemons");
                startGame();
            });
        } else {
            fetchData(endpoint).then(function(jsonResponse) {
                playButton.classList.toggle("loading");
                fillData(jsonResponse);
                startGame();
            });
        }
    } else {
        playButton.classList.toggle("loading");
        words.length = 0;
        const savedData = sessionStorage.getItem("currentData");
        if (savedData) {
            words = JSON.parse(savedData);
        }
        startGame();
    }
});

catButton.addEventListener("click", function() {
    toggleMenuList("category");
});

catButton.addEventListener("focusout", function() {
    let catList = catButton.nextElementSibling;
    if (catList.classList.contains("opened-list")) {
        toggleMenuList("category");
    }
});

diffButton.addEventListener("click", function() {
    toggleMenuList("difficulty");
});

diffButton.addEventListener("focusout", function() {
    let diffList = diffButton.nextElementSibling;
    if (diffList.classList.contains("opened-list")) {
        toggleMenuList("difficulty");
    }
});

document.querySelector(".home-button").addEventListener("click", function() {
    nextButtonTl.pause().progress(0);
    catButton.disabled = false;
    diffButton.disabled = false;
    playButton.disabled = false;
    showMenu();
});

let soundButton = document.querySelector(".sound-button");
soundButton.addEventListener("click", function() {
    soundButton.classList.toggle("disabled");
    allowAudio = !allowAudio;
    if (settingsOpen) updateSettingsUI();
});

let catItems = document.querySelectorAll(".category-list li");
let diffItems = document.querySelectorAll(".difficulty-list li");

catItems.forEach(function(li) {
    li.addEventListener("mousedown", function() {
        catButton.innerText = li.innerText;
        catSpan.innerText = li.innerText.toUpperCase();
        category = li.innerText.toLowerCase();
    });
});

diffItems.forEach(function(li) {
    li.addEventListener("mousedown", function() {
        diffButton.innerText = li.innerText;
        diffSpan.innerText = li.innerText;
        difficulty = li.innerText.toLowerCase();
    });
});

document
    .querySelector(".gameover-box .main-menu")
    .addEventListener("click", function() {
        gsap
            .to(".gameover-box", {
                duration: 0.25,
                scale: 1.6,
                opacity: 0,
                ease: "none",
            })
            .then(function() {
                nextButtonTl.pause().progress(0);
                catButton.disabled = false;
                diffButton.disabled = false;
                playButton.disabled = false;
                showMenu();
                setTimeout(function() {
                    document.querySelector(".gameover-modal").style.visibility =
                        "collapse";
                    if (parallaxInstance) parallaxInstance.enable();
                }, 600);
            });
    });

document
    .querySelector(".gameover-box .play-again")
    .addEventListener("click", restartGame);

console.log('Game initialized successfully!');

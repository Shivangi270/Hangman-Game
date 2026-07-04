// ============================================
// ADMOB MONETIZATION - Banner + Interstitial Ads
// ============================================

let adInitialized = false;
let interstitialReady = false;
let winCounter = 0;
let adsEnabled = true;
let adInProgress = false; // Prevent multiple ad triggers

// YOUR REAL AD UNIT IDs FROM ADMOB CONSOLE
const BANNER_AD_ID = 'ca-app-pub-5834184703937435/4096610957';
const INTERSTITIAL_AD_ID = 'ca-app-pub-5834184703937435/8224547901';
const REWARDED_AD_ID = 'ca-app-pub-5834184703937435/1383839206'; // Test ID - replace with your rewarded ad ID

// DEMO AD UNITS FOR TESTING (uncomment to test without approval)
// const BANNER_AD_ID = 'ca-app-pub-3940256099942544/6300978111';
// const INTERSTITIAL_AD_ID = 'ca-app-pub-3940256099942544/1033173711';
// const REWARDED_AD_ID = 'ca-app-pub-3940256099942544/5224357317';

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
            // Prepare next rewarded ad
            prepareRewardedAd();
        });
    } catch (error) {
        console.log('Rewarded ad error:', error);
    }
}

function showRewardedAd(callback, type) {
    if (!adsEnabled || typeof AdMob === 'undefined') {
        // Fallback: give reward without ad (for testing)
        console.log('Ad not available - giving reward for testing');
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
        // Fallback: still reward after a delay for testing
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
        // Fallback reward
        if (callback) callback();
    }
}

// Prepare rewarded ad on load
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
// DAILY STREAK SYSTEM (Duolingo-style)
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

// Track the current word being guessed for showing correct answer
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

// Called when a word is cleared
const onWordCleared = () => {
    gameStats.levelProgress += 1;
    gameStats.wordsCleared += 1;
    gameStats.totalWordsCleared += 1;
    
    const wordBonus = 10;
    gameStats.totalCoins += wordBonus;
    
    if (gameStats.levelProgress >= 3) {
        // Level complete!
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

// Show Level Complete Popup
const showLevelComplete = () => {
    const modal = document.querySelector('.gameover-modal');
    const box = modal.querySelector('.gameover-box');
    const content = modal.querySelector('.gameover-content');
    const title = modal.querySelector('.text');
    const data = modal.querySelector('.gameover-data');
    const buttons = modal.querySelector('.buttons');
    
    // Clear existing buttons
    buttons.innerHTML = '';
    
    // Store earned coins for this level
    levelCoinsEarned = 30; // Base level bonus
    
    // Update modal content
    title.textContent = '🎉 LEVEL CLEAR!';
    
    // Update data section
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
    
    // Create buttons
    buttons.style.width = '90%';
    buttons.style.display = 'flex';
    buttons.style.flexDirection = 'row';
    buttons.style.justifyContent = 'center';
    buttons.style.gap = '10px';
    buttons.style.marginTop = '15px';
    
    // Button 1: Menu (always present)
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
    
    // Button 2: Next Level (with coins)
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
        // Coins already added in onWordCleared
        closeLevelPopup();
        continueToNextLevel();
    });
    
    // Button 3: Double Coins (rewarded ad)
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
            // Double the coins
            const doubledCoins = levelCoinsEarned;
            gameStats.totalCoins += doubledCoins;
            saveGameStats();
            updateStatsUI();
            levelCoinsEarned *= 2;
            doubleBtn.textContent = `✅ +${doubledCoins} 🪙`;
            doubleBtn.style.background = '#37b666';
            doubleBtn.style.color = 'white';
            // Update the next button text
            nextBtn.innerHTML = `▶ Next  +🪙${levelCoinsEarned}`;
            // Update data display
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
    
    // Show the modal with animation
    modal.style.visibility = 'visible';
    modal.style.opacity = '0';
    box.style.transform = 'scale(0.8)';
    
    gsap.to(modal, { opacity: 1, duration: 0.3 });
    gsap.to(box, { scale: 1, duration: 0.4, ease: 'back.out(1.7)' });
    
    parallaxInstance.disable();
    isLevelFailed = false;
};

// Show Level Failed Popup
const showLevelFailed = (correctWord) => {
    const modal = document.querySelector('.gameover-modal');
    const box = modal.querySelector('.gameover-box');
    const content = modal.querySelector('.gameover-content');
    const title = modal.querySelector('.text');
    const data = modal.querySelector('.gameover-data');
    const buttons = modal.querySelector('.buttons');
    
    // Clear existing buttons
    buttons.innerHTML = '';
    
    // Update modal content
    title.textContent = '😢 LEVEL FAILED';
    
    // Update data section
    data.innerHTML = `
        <div class="level-info" style="text-align: center; width: 100%;">
            <div style="font-size: 1.5rem; color: #ff6b6b; font-weight: bold; margin-bottom: 10px;">
                The word was:
            </div>
            <div style="font-size: 2.5rem; color: white; font-weight: bold; letter-spacing: 4px; 
                        background: rgba(255,255,255,0.1); padding: 10px 20px; border-radius: 10px;
                        border: 2px solid rgba(255,255,255,0.2);">
                ${correctWord.toUpperCase()}
            </div>
            <div style="display: flex; justify-content: space-around; width: 100%; margin-top: 15px; font-size: 1rem;">
                <div>🪙 <span style="color: var(--second-button-color);">${gameStats.totalCoins}</span></div>
                <div>📊 ${gameStats.totalWordsCleared} words</div>
                <div>💎 <span style="color: gold;">${gameStats.totalDiamonds}</span></div>
            </div>
        </div>
    `;
    
    // Create buttons
    buttons.style.width = '90%';
    buttons.style.display = 'flex';
    buttons.style.flexDirection = 'row';
    buttons.style.justifyContent = 'center';
    buttons.style.gap = '10px';
    buttons.style.marginTop = '15px';
    
    // Button 1: Menu (always present)
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
    
    // Button 2: Try Again (watch 15s ad)
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
            // Retry the level - reset with same word
            closeLevelPopup();
            resetCurrentLevel();
            retryBtn.disabled = false;
            adInProgress = false;
        }, 'retry_level');
    });
    
    buttons.appendChild(menuBtn);
    buttons.appendChild(retryBtn);
    
    // Show the modal with animation
    modal.style.visibility = 'visible';
    modal.style.opacity = '0';
    box.style.transform = 'scale(0.8)';
    
    gsap.to(modal, { opacity: 1, duration: 0.3 });
    gsap.to(box, { scale: 1, duration: 0.4, ease: 'back.out(1.7)' });
    
    parallaxInstance.disable();
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
    parallaxInstance.enable();
    updateStatsUI();
};

const continueToNextLevel = () => {
    // Reset game for next level
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
    // Reset the current word array
    const word = currentCorrectWord;
    if (word) {
        wordArray = word.toUpperCase().split('');
        hidden = {};
        // Reset word container
        clearPrevWord(true);
        hideLetters(wordArray);
        createLetterElements(wordArray);
        resetGuesses();
        enableAllButtons();
        updateStatsUI();
    } else {
        // Fallback: get a new word
        setupGame();
        hideLetters(wordArray);
        createLetterElements(wordArray);
        enableAllButtons();
    }
};

// Show cluster complete popup
const showClusterComplete = () => {
    showStreakBonus(`💎 Cluster Complete! +10 Diamonds! 💎`);
};

// ============================================
// ORIGINAL GAME CODE (Modified)
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
        parallaxInstance.enable();
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

// MODIFIED: checkAnswer with level system integration and game over handling
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
                
                // === Level System Integration ===
                const levelCompleted = onWordCleared();
                
                if (levelCompleted) {
                    // Level complete - show level popup
                    disableAllButtons();
                    return;
                }
                
                // Show interstitial ad after every 3 wins (if not level complete)
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
        }
        if (allowAudio && wrongAudio && wrongAudio.play) {
            wrongAudio.volume = 0.2;
            wrongAudio.play();
        }
        reduceGuesses();
        if (typeof pullUp === 'function') pullUp();
        if (guesses === 0) {
            // Game over / Level Failed!
            disableAllButtons();
            if (nextButton) nextButton.disabled = true;
            if (allowAudio && loseAudio && loseAudio.play) {
                loseAudio.volume = 0.2;
                loseAudio.play();
            }
            
            // Store the correct word before showing popup
            const correctWord = currentCorrectWord;
            currentCorrectWord = '';
            
            setTimeout(() => {
                // Show level failed popup with correct word
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
    parallaxInstance.disable();
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
    modal.style.visibility = "visible";
    modal.style.opacity = 1;
    menuBox.classList.toggle("expand");
    menuBox.classList.toggle("drop-down");
    mainContent.classList.toggle("blur-out");
    mainContent.classList.toggle("blur-in");
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
            parallaxInstance.enable();
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

loadSavedBestScore();
loadGameStats();
updateStatsUI();

document.querySelector(".start-game").addEventListener("click", () => {
    catButton.disabled = true;
    diffButton.disabled = true;
    playButton.disabled = true;
    playButton.classList.toggle("loading");
    if (queryParam !== category || words.length === 0) {
        words.length = 0;
        queryParam = category;
        let endpoint = `${wordUrl}${queryParam}`;
        if (category === "pokemons") {
            fetchData(pokeUrl).then((jsonResponse) => {
                playButton.classList.toggle("loading");
                fillData(jsonResponse, "pokemons");
                startGame();
            });
        } else {
            fetchData(endpoint).then((jsonResponse) => {
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

catButton.addEventListener("click", () => {
    toggleMenuList("category");
});

catButton.addEventListener("focusout", () => {
    let catList = catButton.nextElementSibling;
    if (catList.classList.contains("opened-list")) {
        toggleMenuList("category");
    }
});

diffButton.addEventListener("click", () => {
    toggleMenuList("difficulty");
});

diffButton.addEventListener("focusout", () => {
    let diffList = diffButton.nextElementSibling;
    if (diffList.classList.contains("opened-list")) {
        toggleMenuList("difficulty");
    }
});

document.querySelector(".home-button").addEventListener("click", () => {
    nextButtonTl.pause().progress(0);
    catButton.disabled = false;
    diffButton.disabled = false;
    playButton.disabled = false;
    showMenu();
});

let soundButton = document.querySelector(".sound-button");
soundButton.addEventListener("click", () => {
    soundButton.classList.toggle("disabled");
    allowAudio = !allowAudio;
});

let catItems = document.querySelectorAll(".category-list li");
let diffItems = document.querySelectorAll(".difficulty-list li");

catItems.forEach((li) => {
    li.addEventListener("mousedown", () => {
        catButton.innerText = li.innerText;
        catSpan.innerText = li.innerText.toUpperCase();
        category = li.innerText.toLowerCase();
    });
});

diffItems.forEach((li) => {
    li.addEventListener("mousedown", () => {
        diffButton.innerText = li.innerText;
        diffSpan.innerText = li.innerText;
        difficulty = li.innerText.toLowerCase();
    });
});

document
    .querySelector(".gameover-box .main-menu")
    .addEventListener("click", () => {
        gsap
            .to(".gameover-box", {
                duration: 0.25,
                scale: 1.6,
                opacity: 0,
                ease: "none",
            })
            .then((_) => {
                nextButtonTl.pause().progress(0);
                catButton.disabled = false;
                diffButton.disabled = false;
                playButton.disabled = false;
                showMenu();
                setTimeout(() => {
                    document.querySelector(".gameover-modal").style.visibility =
                        "collapse";
                    parallaxInstance.enable();
                }, 600);
            });
    });

document
    .querySelector(".gameover-box .play-again")
    .addEventListener("click", restartGame);

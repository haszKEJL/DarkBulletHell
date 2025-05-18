// Main game file
// Audio elements
const audio = {
    mainMenu: new Audio('./music/mainmenu.mp3'),
    gameMusic: new Audio('./music/stage1.mp3'),
    bomb: new Audio('./music/bomb.wav'),
    shoot: new Audio('./music/gun.wav'),
    timeShift: new Audio('./music/timeshift.wav'),
    die: new Audio('./music/die.wav'),
    win: new Audio('./music/win.wav'),
    lose: new Audio('./music/lose.wav'),
    powerup: new Audio('./music/powerup.wav'),
    select: new Audio('./music/select.wav')
};

audio.mainMenu.loop = true;
audio.gameMusic.loop = true;

let musicVolume = 0.5;
let sfxVolume = 0.5;

// 1. Zapisywanie ustawień dźwięku w localStorage
function updateVolumes() {
    audio.mainMenu.volume = musicVolume;
    audio.gameMusic.volume = musicVolume;
    
    audio.bomb.volume = sfxVolume;
    audio.shoot.volume = sfxVolume;
    audio.timeShift.volume = sfxVolume;
    audio.die.volume = sfxVolume;
    audio.win.volume = sfxVolume;
    audio.lose.volume = sfxVolume;
    audio.powerup.volume = sfxVolume;
    audio.select.volume = sfxVolume;
    
    // Zapisz wartości w localStorage
    localStorage.setItem('musicVolume', musicVolume);
    localStorage.setItem('sfxVolume', sfxVolume);
}

if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (typeof radius === 'number') {
            radius = {tl: radius, tr: radius, br: radius, bl: radius};
        } else {
            radius = {...{tl: 0, tr: 0, br: 0, bl: 0}, ...radius};
        }
        
        this.beginPath();
        this.moveTo(x + radius.tl, y);
        this.lineTo(x + width - radius.tr, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        this.lineTo(x + width, y + height - radius.br);
        this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        this.lineTo(x + radius.bl, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        this.lineTo(x, y + radius.tl);
        this.quadraticCurveTo(x, y, x + radius.tl, y);
        this.closePath();
        return this;
    };
}

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

class GameMenu {
    constructor(gameCanvas, gameContext) {
        this.canvas = gameCanvas;
        this.ctx = gameContext;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.currentScreen = 'main';
        this.backgroundImage = new Image();
        this.backgroundImage.src = './model/menu_background.png';
        
        this.buttons = {
            main: [
                { text: 'Start', x: this.width / 2, y: this.height / 2 - 40, width: 250, height: 60, action: 'character' },
                { text: 'Options', x: this.width / 2, y: this.height / 2 + 40, width: 250, height: 60, action: 'options' },
                { text: 'High Scores', x: this.width / 2, y: this.height / 2 + 120, width: 250, height: 60, action: 'highscore' }
            ],
            options: [
                { text: 'Back to Menu', x: this.width / 2, y: this.height - 100, width: 250, height: 60, action: 'main' }
            ],
            character: [
                { text: 'Start Game', x: this.width / 2, y: this.height - 170, width: 250, height: 60, action: 'start' },
                { text: 'Back to Menu', x: this.width / 2, y: this.height - 100, width: 250, height: 60, action: 'main' }
            ],
            highscore: [
                { text: 'Back to Menu', x: this.width / 2, y: this.height - 100, width: 250, height: 60, action: 'main' }
            ],
            gameover: [
                { text: 'Retry', x: this.width / 2, y: this.height / 2 + 80, width: 250, height: 60, action: 'character' },
                { text: 'Main Menu', x: this.width / 2, y: this.height / 2 + 160, width: 250, height: 60, action: 'main' }
            ]
        };

        this.sliders = {
            musicVolume: { x: this.width / 2, y: this.height / 2 - 50, width: 250, height: 20, value: musicVolume, label: 'Music:' },
            sfxVolume: { x: this.width / 2, y: this.height / 2 + 50, width: 250, height: 20, value: sfxVolume, label: 'SFX:' }
        };

        this.characters = [
            { name: 'Reimu', image: './model/reimu.png', x: this.width / 3, y: this.height / 2 - 50 },
            { name: 'Flandre', image: './model/flandre.png', x: this.width * 2 / 3, y: this.height / 2 - 50 }
        ];

        this.characterImages = [];
        this.characters.forEach((char, index) => {
            this.characterImages[index] = new Image();
            this.characterImages[index].src = char.image;
        });

        this.highScores = [];
        this.loadHighScores();

        this.selectedCharacter = null;
        this.isSliderActive = false;
        this.activeSlider = null;
        this.gameStartCallback = null;
        this.scoreValue = 0;
        
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    }

    loadHighScores() {
        this.highScores = JSON.parse(localStorage.getItem('highScores')) || [];
        
        if (this.highScores.length === 0) {
            this.highScores = [
            ];
        }
    }

    setGameStartCallback(callback) {
        this.gameStartCallback = callback;
    }

    setFinalScore(score) {
        this.scoreValue = score;
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const buttons = this.buttons[this.currentScreen];
        if (buttons) {
            for (const button of buttons) {
                if (x >= button.x - button.width / 2 && x <= button.x + button.width / 2 &&
                    y >= button.y - button.height / 2 && y <= button.y + button.height / 2) {
                    
                    // Blokada przycisku Start Game gdy nie wybrano postaci
                    if (button.action === 'start' && this.selectedCharacter === null) {
                        // Nie pozwalaj wystartować - pokaż komunikat
                        this.showMessage('Please select a character first!');
                        return;
                    }
                    
                    audio.select.play();
                    
                    if (button.action === 'start' && this.selectedCharacter !== null) {
                        if (this.gameStartCallback) {
                            this.gameStartCallback(this.selectedCharacter);
                        }
                    } else {
                        this.currentScreen = button.action;
                        
                        if (this.currentScreen === 'main') {
                            audio.mainMenu.play();
                            audio.gameMusic.pause();
                            audio.gameMusic.currentTime = 0;
                        }
                    }
                    return;
                }
            }
        }

        if (this.currentScreen === 'options') {
            for (const [key, slider] of Object.entries(this.sliders)) {
                if (x >= slider.x - slider.width / 2 && x <= slider.x + slider.width / 2 &&
                    y >= slider.y - slider.height / 2 && y <= slider.y + slider.height / 2) {
                    this.isSliderActive = true;
                    this.activeSlider = key;
                    const relativeX = x - (slider.x - slider.width / 2);
                    slider.value = Math.max(0, Math.min(1, relativeX / slider.width));
                    
                    if (key === 'musicVolume') {
                        musicVolume = slider.value;
                    } else if (key === 'sfxVolume') {
                        sfxVolume = slider.value;
                    }
                    updateVolumes();
                    
                    return;
                }
            }
        }

        if (this.currentScreen === 'character') {
            for (let i = 0; i < this.characters.length; i++) {
                const char = this.characters[i];
                if (x >= char.x - 75 && x <= char.x + 75 &&
                    y >= char.y - 75 && y <= char.y + 125) {
                    audio.select.play();
                    this.selectedCharacter = i;
                    return;
                }
            }
        }
    }

    handleMouseUp() {
        this.isSliderActive = false;
        this.activeSlider = null;
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        if (this.isSliderActive && this.activeSlider) {
            const slider = this.sliders[this.activeSlider];
            const relativeX = x - (slider.x - slider.width / 2);
            slider.value = Math.max(0, Math.min(1, relativeX / slider.width));
            
            if (this.activeSlider === 'musicVolume') {
                musicVolume = slider.value;
            } else if (this.activeSlider === 'sfxVolume') {
                sfxVolume = slider.value;
            }
            updateVolumes();
        }
    }

    drawBackground() {
        if (this.backgroundImage.complete) {
            this.ctx.globalAlpha = 0.4;
            this.ctx.drawImage(this.backgroundImage, 0, 0, this.width, this.height);
            this.ctx.globalAlpha = 1.0;
        }
        
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 50,
            this.width / 2, this.height / 2, this.height
        );
        gradient.addColorStop(0, 'rgba(50, 0, 50, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawButton(button) {
        this.ctx.fillStyle = 'rgba(20, 0, 20, 0.6)';
        this.ctx.strokeStyle = '#ff0055';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(button.x - button.width / 2, button.y - button.height / 2, button.width, button.height, 5);
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(button.text, button.x, button.y);
    }

    drawSlider(slider) {
        // Tło suwaka
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.roundRect(slider.x - slider.width / 2, slider.y - slider.height / 2, slider.width, slider.height, 6);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Gradient wypełnienia suwaka
        const gradient = this.ctx.createLinearGradient(
            slider.x - slider.width / 2, slider.y,
            slider.x - slider.width / 2 + slider.width * slider.value, slider.y
        );
        
        if (slider === this.sliders.musicVolume) {
            gradient.addColorStop(0, '#ff00dd');
            gradient.addColorStop(1, '#9900ff');
        } else {
            gradient.addColorStop(0, '#ff0055');
            gradient.addColorStop(1, '#ff5500');
        }
        
        // Wypełnienie suwaka
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.roundRect(
            slider.x - slider.width / 2, slider.y - slider.height / 2, 
            slider.width * slider.value, slider.height, 6
        );
        this.ctx.fill();
        
        // Uchwyt suwaka
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(
            slider.x - slider.width / 2 + slider.width * slider.value, 
            slider.y, slider.height, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // Etykieta suwaka - zmniejszony tekst
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Orbitron';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(slider.label, slider.x - slider.width / 2 - 10, slider.y);
        
        // Wartość procentowa
        this.ctx.textAlign = 'left';
        this.ctx.fillText(
            Math.round(slider.value * 100) + '%', 
            slider.x + slider.width / 2 + 10, slider.y
        );
    }

    drawMainMenu() {
        this.ctx.fillStyle = '#ff0055';
        this.ctx.font = '48px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(255, 0, 85, 0.5)';
        this.ctx.shadowBlur = 20;
        this.ctx.fillText('Dark Bullet Hell', this.width / 2, this.height / 4);
        this.ctx.shadowBlur = 0;
        
        for (const button of this.buttons.main) {
            this.drawButton(button);
        }
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '14px Orbitron';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText('v1.0', this.width - 20, this.height - 20);
    }

    drawOptionsMenu() {
        this.ctx.fillStyle = '#ff0055';
        this.ctx.font = '32px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(255, 0, 85, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText('Options', this.width / 2, this.height / 4);
        this.ctx.shadowBlur = 0;
        
        // Zwiększam panel opcji
        this.ctx.fillStyle = 'rgba(30, 30, 30, 0.8)';
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.roundRect(this.width / 2 - 250, this.height / 2 - 100, 500, 200, 5);
        this.ctx.fill();
        this.ctx.stroke();
        
        for (const slider of Object.values(this.sliders)) {
            this.drawSlider(slider);
        }
        
        for (const button of this.buttons.options) {
            this.drawButton(button);
        }
    }

    drawCharacterSelect() {
        this.ctx.fillStyle = '#ff0055';
        this.ctx.font = '32px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(255, 0, 85, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText('Choose Your Character', this.width / 2, this.height / 4);
        this.ctx.shadowBlur = 0;
        
        for (let i = 0; i < this.characters.length; i++) {
            const char = this.characters[i];
            
            if (this.selectedCharacter === i) {
                this.ctx.fillStyle = 'rgba(255, 0, 85, 0.2)';
                this.ctx.strokeStyle = '#ff0055';
                this.ctx.lineWidth = 2;
            } else {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.strokeStyle = 'transparent';
                this.ctx.lineWidth = 2;
            }
            this.ctx.beginPath();
            this.ctx.roundRect(char.x - 75, char.y - 75, 150, 200, 10);
            this.ctx.fill();
            this.ctx.stroke();
            
            if (this.characterImages[i] && this.characterImages[i].complete) {
                this.ctx.drawImage(this.characterImages[i], char.x - 60, char.y - 60, 120, 120);
            }
            
            this.ctx.fillStyle = '#e0e0e0';
            this.ctx.font = '18px Orbitron';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(char.name, char.x, char.y + 85);
        }
        
        // Zmiana wyglądu przycisku Start Game w zależności od tego czy wybrano postać
        for (const button of this.buttons.character) {
            if (button.text === 'Start Game') {
                if (this.selectedCharacter === null) {
                    // Nieaktywny przycisk - wyszarzony
                    this.ctx.fillStyle = 'rgba(20, 20, 20, 0.3)';
                    this.ctx.strokeStyle = '#444444';
                } else {
                    // Aktywny przycisk - normalny wygląd
                    this.ctx.fillStyle = 'rgba(20, 0, 20, 0.6)';
                    this.ctx.strokeStyle = '#ff0055';
                }
            } else {
                // Inne przyciski - normalny wygląd
                this.ctx.fillStyle = 'rgba(20, 0, 20, 0.6)';
                this.ctx.strokeStyle = '#ff0055';
            }
            
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.roundRect(button.x - button.width / 2, button.y - button.height / 2, button.width, button.height, 5);
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.fillStyle = button.text === 'Start Game' && this.selectedCharacter === null ? '#888888' : '#ffffff';
            this.ctx.font = '20px Orbitron';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(button.text, button.x, button.y);
        }
    }

    drawHighScoreScreen() {
        this.ctx.fillStyle = '#ff0055';
        this.ctx.font = '32px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(255, 0, 85, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText('High Scores', this.width / 2, this.height / 4);
        this.ctx.shadowBlur = 0;
        
        // Większy i ładniejszy panel z gradientem
        const panelWidth = 500;
        const panelHeight = 360;
        
        // Tło z gradientem
        const gradient = this.ctx.createLinearGradient(
            this.width / 2 - panelWidth/2, 
            this.height / 2 - panelHeight/2, 
            this.width / 2 + panelWidth/2, 
            this.height / 2 + panelHeight/2
        );
        gradient.addColorStop(0, 'rgba(40, 10, 40, 0.9)');
        gradient.addColorStop(1, 'rgba(20, 5, 20, 0.9)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.strokeStyle = 'rgba(255, 0, 85, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(this.width / 2 - panelWidth/2, this.height / 2 - panelHeight/2, panelWidth, panelHeight, 10);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Nagłówki kolumn z gradientem
        const headerGradient = this.ctx.createLinearGradient(
            this.width / 2 - panelWidth/2 + 20, 
            this.height / 2 - panelHeight/2 + 30,
            this.width / 2 + panelWidth/2 - 20, 
            this.height / 2 - panelHeight/2 + 30
        );
        headerGradient.addColorStop(0, '#ff0055');
        headerGradient.addColorStop(1, '#ff00aa');
        
        this.ctx.fillStyle = headerGradient;
        this.ctx.font = '22px Orbitron';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Rank', this.width / 2 - panelWidth/2 + 40, this.height / 2 - panelHeight/2 + 40);
        this.ctx.fillText('Name', this.width / 2 - panelWidth/2 + 150, this.height / 2 - panelHeight/2 + 40);
        
        this.ctx.textAlign = 'right';
        this.ctx.fillText('Score', this.width / 2 + panelWidth/2 - 40, this.height / 2 - panelHeight/2 + 40);
        
        // Linia oddzielająca nagłówki z gradientem
        const lineGradient = this.ctx.createLinearGradient(
            this.width / 2 - panelWidth/2 + 20, 
            this.height / 2 - panelHeight/2 + 60,
            this.width / 2 + panelWidth/2 - 20, 
            this.height / 2 - panelHeight/2 + 60
        );
        lineGradient.addColorStop(0, '#ff0055');
        lineGradient.addColorStop(0.5, '#ffffff');
        lineGradient.addColorStop(1, '#ff0055');
        
        this.ctx.strokeStyle = lineGradient;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.width / 2 - panelWidth/2 + 20, this.height / 2 - panelHeight/2 + 60);
        this.ctx.lineTo(this.width / 2 + panelWidth/2 - 20, this.height / 2 - panelHeight/2 + 60);
        this.ctx.stroke();
        
        let yPos = this.height / 2 - panelHeight/2 + 90;
        
        if (this.highScores.length === 0) {
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '24px Orbitron';
            this.ctx.fillText('No high scores yet!', this.width / 2, this.height / 2);
        } else {
            // Wyniki
            for (let i = 0; i < Math.min(this.highScores.length, 10); i++) {
                const score = this.highScores[i];
                
                // Tło wiersza (naprzemienne dla lepszej czytelności)
                this.ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.2)';
                this.ctx.fillRect(this.width / 2 - panelWidth/2 + 20, yPos - 15, panelWidth - 40, 30);
                
                // Rank z odpowiednim kolorem i efektami
                this.ctx.textAlign = 'center';
                if (i < 3) {
                    let rankColor;
                    let glow;
                    
                    switch (i) {
                        case 0: // Złoty
                            rankColor = '#ffcc00';
                            glow = 'rgba(255, 204, 0, 0.8)';
                            break;
                        case 1: // Srebrny
                            rankColor = '#cccccc';
                            glow = 'rgba(204, 204, 204, 0.8)';
                            break;
                        case 2: // Brązowy
                            rankColor = '#cc8844';
                            glow = 'rgba(204, 136, 68, 0.8)';
                            break;
                    }
                    
                    this.ctx.fillStyle = rankColor;
                    this.ctx.shadowColor = glow;
                    this.ctx.shadowBlur = 5;
                    this.ctx.font = 'bold 18px Orbitron';
                    this.ctx.fillText(`${i + 1}.`, this.width / 2 - panelWidth/2 + 40, yPos);
                    this.ctx.shadowBlur = 0;
                } else {
                    this.ctx.fillStyle = '#888888';
                    this.ctx.font = '18px Orbitron';
                    this.ctx.fillText(`${i + 1}.`, this.width / 2 - panelWidth/2 + 40, yPos);
                }
                
                // Name
                this.ctx.textAlign = 'left';
                this.ctx.fillStyle = i < 3 ? '#ffffff' : '#aaaaaa';
                this.ctx.font = i < 3 ? 'bold 18px Orbitron' : '18px Orbitron';
                this.ctx.fillText(score.name || 'Player', this.width / 2 - panelWidth/2 + 150, yPos);
                
                // Score
                this.ctx.textAlign = 'right';
                if (i < 3) {
                    this.ctx.fillStyle = i === 0 ? '#ffcc00' : (i === 1 ? '#cccccc' : '#cc8844');
                    this.ctx.shadowColor = i === 0 ? 'rgba(255, 204, 0, 0.5)' : 
                                        (i === 1 ? 'rgba(204, 204, 204, 0.5)' : 'rgba(204, 136, 68, 0.5)');
                    this.ctx.shadowBlur = 3;
                    this.ctx.font = 'bold 18px Orbitron';
                    this.ctx.fillText(score.score.toLocaleString(), this.width / 2 + panelWidth/2 - 40, yPos);
                    this.ctx.shadowBlur = 0;
                } else {
                    this.ctx.fillStyle = '#aaaaaa';
                    this.ctx.font = '18px Orbitron';
                    this.ctx.fillText(score.score.toLocaleString(), this.width / 2 + panelWidth/2 - 40, yPos);
                }
                
                yPos += 30;
            }
        }
        
        // Bardziej elegancki przycisk powrotu
        for (const button of this.buttons.highscore) {
            this.ctx.fillStyle = 'rgba(20, 0, 20, 0.7)';
            this.ctx.strokeStyle = '#ff0055';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.roundRect(button.x - button.width / 2, button.y - button.height / 2, button.width, button.height, 8);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Dodanie gradientu do przycisku
            const buttonGradient = this.ctx.createLinearGradient(
                button.x - button.width / 2, button.y,
                button.x + button.width / 2, button.y
            );
            buttonGradient.addColorStop(0, 'rgba(255, 0, 85, 0.1)');
            buttonGradient.addColorStop(0.5, 'rgba(255, 0, 85, 0.3)');
            buttonGradient.addColorStop(1, 'rgba(255, 0, 85, 0.1)');
            
            this.ctx.fillStyle = buttonGradient;
            this.ctx.fill();
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '20px Orbitron';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(button.text, button.x, button.y);
            
            // Dodanie symbolicznej ikony powrotu przed tekstem
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.moveTo(button.x - 80, button.y);
            this.ctx.lineTo(button.x - 60, button.y - 8);
            this.ctx.lineTo(button.x - 60, button.y + 8);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    drawGameOver() {
        // Tytuł
        this.ctx.fillStyle = '#ff0055';
        this.ctx.font = '48px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(255, 0, 85, 0.7)';
        this.ctx.shadowBlur = 15;
        
        if (gameState.gameWon) {
            this.ctx.fillText('Victory!', this.width / 2, this.height / 4);
        } else {
            this.ctx.fillText('Game Over', this.width / 2, this.height / 4);
        }
        this.ctx.shadowBlur = 0;
        
        // Panel wyników - ZWIĘKSZONA WYSOKOŚĆ
        const panelWidth = 400;
        const panelHeight = 150; // Zmniejszono z 200 na 150
        
        // Tło panelu
        const gradient = this.ctx.createLinearGradient(
            this.width / 2 - panelWidth/2, 
            this.height / 2 - panelHeight/2, 
            this.width / 2 + panelWidth/2, 
            this.height / 2 + panelHeight/2
        );
        gradient.addColorStop(0, 'rgba(40, 10, 40, 0.9)');
        gradient.addColorStop(1, 'rgba(20, 5, 20, 0.9)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.strokeStyle = 'rgba(255, 0, 85, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(this.width / 2 - panelWidth/2, this.height / 2 - panelHeight/2, panelWidth, panelHeight, 10);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Tekst wyników
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Your Score', this.width / 2, this.height / 2 - 40);
        
        // Wynik (większy i z efektem)
        this.ctx.font = '36px Orbitron';
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.shadowColor = 'rgba(255, 204, 0, 0.7)';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(this.scoreValue.toLocaleString(), this.width / 2, this.height / 2 + 10);
        this.ctx.shadowBlur = 0;
        
        // Przyciski - PRZESUNIĘTE NIŻEJ
        let buttonOffset = 180; // Zmieniono z 80/160 na wyższe wartości
        
        for (const button of this.buttons.gameover) {
            // Aktualizacja pozycji przycisku
            if (button.text === 'Retry') {
                button.y = this.height / 2 + buttonOffset;
                buttonOffset += 80; // Zwiększono odstęp między przyciskami
            } else if (button.text === 'Main Menu') {
                button.y = this.height / 2 + buttonOffset;
            }
            
            this.ctx.fillStyle = 'rgba(20, 0, 20, 0.7)';
            this.ctx.strokeStyle = '#ff0055';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.roundRect(button.x - button.width / 2, button.y - button.height / 2, button.width, button.height, 8);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Gradient przycisku
            const buttonGradient = this.ctx.createLinearGradient(
                button.x - button.width / 2, button.y,
                button.x + button.width / 2, button.y
            );
            buttonGradient.addColorStop(0, 'rgba(255, 0, 85, 0.1)');
            buttonGradient.addColorStop(0.5, 'rgba(255, 0, 85, 0.3)');
            buttonGradient.addColorStop(1, 'rgba(255, 0, 85, 0.1)');
            
            this.ctx.fillStyle = buttonGradient;
            this.ctx.fill();
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '20px Orbitron';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(button.text, button.x, button.y);
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawBackground();
        
        switch (this.currentScreen) {
            case 'main':
                this.drawMainMenu();
                break;
            case 'options':
                this.drawOptionsMenu();
                break;
            case 'character':
                this.drawCharacterSelect();
                break;
            case 'highscore':
                this.drawHighScoreScreen();
                break;
            case 'gameover':
                this.drawGameOver();
                break;
        }
    }
}

// 1. Modyfikacja wartości maxPower na podstawie poziomów strzelania
let gameState = {
    running: false,
    paused: false,
    characterSelected: null,
    score: 0,
    lives: 3,
    bombs: 3,
    power: 1,
    maxPower: 20, // Zwiększono z 4 na 20, aby pasowało do poziomów strzelania
    timeEnergy: 100,
    maxTimeEnergy: 100,
    timeShiftActive: false,
    elapsedTime: 0,
    bossPhase: false,
    gameProgress: 0,
    gameWon: false
};

const images = {
    background: loadImage('./model/background.png'),
    reimu: loadImage('./model/reimu.png'),
    flandre: loadImage('./model/flandre.png'),
    enemy1: loadImage('./model/enemy_1.png'),
    enemy2: loadImage('./model/enemy_2.png'),
    boss: loadImage('./model/sigma.png'),
    powerup: loadImage('./model/power.png'),
    heart: loadImage('./model/heart.png'),
    bomb: loadImage('./model/bomb.png')
};

function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

let gameMenu = null;
let player = null;
let playerBullets = [];
let enemies = [];
let enemyBullets = [];
let powerups = [];
let background = {
    y: 0,
    speed: 0.5,
    image: images.background
};
let boss = null;

const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    shift: false,
    z: false,
    c: false
};

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

class Entity {
    constructor(x, y, width, height, speed, image) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.image = image;
        this.markedForDeletion = false;
    }

    draw() {
        ctx.drawImage(this.image, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }
}

class Player extends Entity {
    constructor(x, y, width, height, speed, image) {
        super(x, y, width, height, speed, image);
        this.hitboxRadius = 5;
        this.shootCooldown = 0;
        this.invulnerable = 0;
        this.normalSpeed = speed * 0.7; // Zmniejszona prędkość postaci o 30%
        this.timeShiftSpeed = this.normalSpeed * 0.75;
    }

    update(deltaTime) {
        const currentSpeed = gameState.timeShiftActive ? this.timeShiftSpeed : this.normalSpeed;
        
        if (keys.up && this.y - this.height / 2 > 0) {
            this.y -= currentSpeed;
        }
        if (keys.down && this.y + this.height / 2 < CANVAS_HEIGHT) {
            this.y += currentSpeed;
        }
        if (keys.left && this.x - this.width / 2 > 0) {
            this.x -= currentSpeed;
        }
        if (keys.right && this.x + this.width / 2 < CANVAS_WIDTH) {
            this.x += currentSpeed;
        }

        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }

        if (keys.z && this.shootCooldown <= 0) {
            this.shoot();
            audio.shoot.currentTime = 0;
            audio.shoot.play();
            this.shootCooldown = 0.1;
        }

        if (keys.c && gameState.bombs > 0 && !this.bombUsed) {
            this.useBomb();
            this.bombUsed = true;
        } else if (!keys.c) {
            this.bombUsed = false;
        }

        if (this.invulnerable > 0) {
            this.invulnerable -= deltaTime;
        }
    }

    shoot() {
        const powerLevel = Math.floor(gameState.power);
        
        if (powerLevel <= 5) {
            playerBullets.push(new Bullet(this.x, this.y - 15, 8, 16, 10, 'player'));
        }
        else if (powerLevel <= 10) {
            playerBullets.push(new Bullet(this.x - 10, this.y - 15, 8, 16, 10, 'player'));
            playerBullets.push(new Bullet(this.x + 10, this.y - 15, 8, 16, 10, 'player'));
        }
        else if (powerLevel <= 15) {
            playerBullets.push(new Bullet(this.x, this.y - 20, 8, 16, 10, 'player'));
            playerBullets.push(new Bullet(this.x - 15, this.y - 10, 8, 16, 10, 'player', -0.2));
            playerBullets.push(new Bullet(this.x + 15, this.y - 10, 8, 16, 10, 'player', 0.2));
        }
        else {
            playerBullets.push(new Bullet(this.x - 10, this.y - 15, 8, 16, 10, 'player'));
            playerBullets.push(new Bullet(this.x + 10, this.y - 15, 8, 16, 10, 'player'));
            playerBullets.push(new Bullet(this.x - 20, this.y - 5, 8, 16, 10, 'player', -0.3));
            playerBullets.push(new Bullet(this.x + 20, this.y - 5, 8, 16, 10, 'player', 0.3));
        }
    }

    useBomb() {
        gameState.bombs--;
        updateBombsDisplay();
        audio.bomb.play();
        
        // Dodanie animacji bomby
        createBombAnimation();
        
        enemyBullets = [];
        
        enemies.forEach(enemy => {
            enemy.health -= 5;
            if (enemy.health <= 0) {
                enemy.markedForDeletion = true;
                gameState.score += enemy.pointValue;
            }
        });
        
        if (boss) {
            boss.health -= 20;
            if (boss.health <= 0) {
                boss = null;
                gameState.gameWon = true;
            }
        }
        
        this.invulnerable = 3;
    }

    draw() {
        super.draw();
        
        let opacity = 1;
        if (this.invulnerable > 0) {
            opacity = (Math.sin(Date.now() / 50) + 1) / 2 * 0.8 + 0.2;
        }
        
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.hitboxRadius
        );
        gradient.addColorStop(0, `rgba(255, 50, 50, ${opacity})`);
        gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.hitboxRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        if (this.invulnerable > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.hitboxRadius + 8, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.stroke();
        }
    }
}

class Enemy extends Entity {
    constructor(x, y, width, height, speed, image, health = 3, pointValue = 100, bulletPattern = 'basic') {
        super(x, y, width, height, speed, image);
        this.health = health;
        this.pointValue = pointValue;
        this.bulletPattern = bulletPattern;
        this.shootTimer = randomBetween(1, 3);
        this.normalSpeed = speed;
        this.timeShiftSpeed = speed * 0.25;
    }

    update(deltaTime) {
        const currentSpeed = gameState.timeShiftActive ? this.timeShiftSpeed : this.normalSpeed;
        this.y += currentSpeed * deltaTime * 60;
        
        if (this.y > CANVAS_HEIGHT + this.height / 2) {
            this.markedForDeletion = true;
        }
        
        this.shootTimer -= deltaTime;
        if (this.shootTimer <= 0) {
            this.shoot();
            this.shootTimer = randomBetween(2, 4);
        }
    }

    shoot() {
        if (!player) return;
        
        switch (this.bulletPattern) {
            case 'basic':
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                enemyBullets.push(new Bullet(
                    this.x, 
                    this.y,
                    8,
                    8,
                    3,
                    'enemy',
                    Math.cos(angle),
                    Math.sin(angle)
                ));
                break;
                
            case 'spread':
                for (let i = -1; i <= 1; i++) {
                    const angle = Math.atan2(player.y - this.y, player.x - this.x) + i * 0.3;
                    enemyBullets.push(new Bullet(
                        this.x,
                        this.y,
                        8,
                        8,
                        3,
                        'enemy',
                        Math.cos(angle),
                        Math.sin(angle)
                    ));
                }
                break;
        }
    }
}

class Boss extends Entity {
    constructor(x, y, width, height, speed, image) {
        super(x, y, width, height, speed, image);
        this.health = 100;
        this.maxHealth = 100;
        this.pointValue = 10000;
        this.attackPatterns = ['circle', 'aimed', 'spiral'];
        this.currentPattern = 0;
        this.shootTimer = 1;
        this.patternTimer = 10;
        this.angleOffset = 0;
        this.normalSpeed = speed;
        this.timeShiftSpeed = speed * 0.25;
        this.targetX = CANVAS_WIDTH / 2;
        this.targetY = 150;
        this.moveSpeed = 2;
    }

    update(deltaTime) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 1) {
            const currentSpeed = gameState.timeShiftActive ? this.timeShiftSpeed : this.normalSpeed;
            this.x += dx / distance * currentSpeed;
            this.y += dy / distance * currentSpeed;
        }
        
        if (Math.random() < 0.005) {
            this.targetX = randomBetween(100, CANVAS_WIDTH - 100);
        }
        
        this.shootTimer -= deltaTime;
        if (this.shootTimer <= 0) {
            this.shoot();
            this.shootTimer = gameState.timeShiftActive ? 0.5 : 0.2;
        }
        
        this.patternTimer -= deltaTime;
        if (this.patternTimer <= 0) {
            this.currentPattern = (this.currentPattern + 1) % this.attackPatterns.length;
            this.patternTimer = 10;
        }
        
        this.angleOffset += 0.03;
    }

    shoot() {
        switch (this.attackPatterns[this.currentPattern]) {
            case 'circle':
                const bulletsCount = 12;
                for (let i = 0; i < bulletsCount; i++) {
                    const angle = (i / bulletsCount) * Math.PI * 2 + this.angleOffset;
                    enemyBullets.push(new Bullet(
                        this.x,
                        this.y,
                        10,
                        10,
                        2.5,
                        'enemy',
                        Math.cos(angle),
                        Math.sin(angle)
                    ));
                }
                break;
                
            case 'aimed':
                if (player) {
                    const angle = Math.atan2(player.y - this.y, player.x - this.x);
                    for (let i = -2; i <= 2; i++) {
                        enemyBullets.push(new Bullet(
                            this.x,
                            this.y,
                            10,
                            10,
                            3,
                            'enemy',
                            Math.cos(angle + i * 0.15),
                            Math.sin(angle + i * 0.15)
                        ));
                    }
                }
                break;
                
            case 'spiral':
                for (let i = 0; i < 3; i++) {
                    const angle = this.angleOffset + (i * Math.PI * 2 / 3);
                    enemyBullets.push(new Bullet(
                        this.x,
                        this.y,
                        10,
                        10,
                        3,
                        'enemy',
                        Math.cos(angle),
                        Math.sin(angle)
                    ));
                }
                break;
        }
    }

    draw() {
        super.draw();
        
        const barWidth = 200;
        const barHeight = 15;
        const x = (CANVAS_WIDTH - barWidth) / 2;
        const y = 20;
        
        ctx.fillStyle = 'rgba(50, 50, 50, 0.7)';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        const healthRatio = this.health / this.maxHealth;
        const healthWidth = barWidth * healthRatio;
        
        const gradient = ctx.createLinearGradient(x, y, x + healthWidth, y);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(1, '#ff5500');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, healthWidth, barHeight);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}

class Bullet {
    constructor(x, y, width, height, speed, type, dirX = 0, dirY = -1) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.type = type;
        this.dirX = dirX;
        this.dirY = dirY;
        this.markedForDeletion = false;
        this.normalSpeed = speed;
        this.timeShiftSpeed = type === 'player' ? speed * 0.75 : speed * 0.25;
    }

    update(deltaTime) {
        const currentSpeed = gameState.timeShiftActive ? this.timeShiftSpeed : this.normalSpeed;
        this.x += this.dirX * currentSpeed;
        this.y += this.dirY * currentSpeed;
        
        if (this.y < -this.height || this.y > CANVAS_HEIGHT + this.height || 
            this.x < -this.width || this.x > CANVAS_WIDTH + this.width) {
            this.markedForDeletion = true;
        }
    }

    draw() {
        ctx.save();
        
        if (this.type === 'player') {
            const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#88bbff');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
            
            ctx.shadowColor = '#88bbff';
            ctx.shadowBlur = 10;
        } else {
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.width/2);
            gradient.addColorStop(0, '#ff7700');
            gradient.addColorStop(1, '#ff0000');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 10;
        }
        
        ctx.restore();
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 20;
        this.height = 20;
        this.speed = 2;
        this.markedForDeletion = false;
        this.image = type === 'power' ? images.powerup : 
                     type === 'heart' ? images.heart : 
                     images.bomb;
    }

    update() {
        this.y += this.speed;
        
        if (this.y > CANVAS_HEIGHT + this.height) {
            this.markedForDeletion = true;
        }
        
        if (player && distance(this.x, this.y, player.x, player.y) < 30) {
            this.collect();
        }
    }

    draw() {
        ctx.drawImage(this.image, this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        ctx.save();
        ctx.shadowColor = this.type === 'power' ? '#ffff00' : 
                          this.type === 'heart' ? '#ff0000' : 
                          '#0088ff';
        ctx.shadowBlur = 10;
        ctx.drawImage(this.image, this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        ctx.restore();
    }

    collect() {
        audio.powerup.currentTime = 0;
        audio.powerup.play();
        
        switch (this.type) {
            case 'power':
                if (gameState.power < gameState.maxPower) {
                    gameState.power += 1.0;
                    if (gameState.power > gameState.maxPower) {
                        gameState.power = gameState.maxPower;
                    }
                } else {
                    gameState.score += 500;
                }
                updatePowerBar();
                break;
                
            case 'heart':
                if (gameState.lives < 5) {
                    gameState.lives++;
                    updateLivesDisplay();
                } else {
                    gameState.score += 1000;
                }
                break;
                
            case 'bomb':
                if (gameState.bombs < 5) {
                    gameState.bombs++;
                    updateBombsDisplay();
                } else {
                    gameState.score += 750;
                }
                break;
        }
        
        this.markedForDeletion = true;
    }
}

function initGame() {
    // Remove any existing game UI first
    const existingUI = document.getElementById('game-ui');
    if (existingUI) {
        existingUI.remove();
    }
    
    gameState.running = true;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.bombs = 3;
    gameState.power = 1;
    gameState.timeEnergy = gameState.maxTimeEnergy;
    gameState.timeShiftActive = false;
    gameState.elapsedTime = 0;
    gameState.gameProgress = 0;
    gameState.bossPhase = false;
    gameState.gameWon = false;
    
    player = new Player(
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT - 100,
        50,
        50,
        3.5, // Zmieniono z 5 na 3.5 - wolniejsza postać
        gameState.characterSelected === 0 ? images.reimu : images.flandre
    );
    
    playerBullets = [];
    enemies = [];
    enemyBullets = [];
    powerups = [];
    boss = null;
    
    createGameUI();
}

function createGameUI() {
    const gameUI = document.createElement('div');
    gameUI.id = 'game-ui';
    gameUI.style.position = 'absolute';
    gameUI.style.width = '100%';
    gameUI.style.height = '100%';
    gameUI.style.top = '0';
    gameUI.style.left = '0';
    gameUI.style.padding = '10px';
    gameUI.style.pointerEvents = 'none';
    
    const scoreDisplay = document.createElement('div');
    scoreDisplay.id = 'score-display';
    scoreDisplay.textContent = `Score: ${gameState.score}`;
    scoreDisplay.style.color = '#fff';
    scoreDisplay.style.fontSize = '18px';
    scoreDisplay.style.textShadow = '0 0 5px rgba(255, 255, 255, 0.7)';
    
    const livesContainer = document.createElement('div');
    livesContainer.id = 'lives-container';
    livesContainer.style.display = 'flex';
    livesContainer.style.marginBottom = '5px';
    
    const bombsContainer = document.createElement('div');
    bombsContainer.id = 'bombs-container';
    bombsContainer.style.display = 'flex';
    bombsContainer.style.marginBottom = '5px';
    
    const statsContainer = document.createElement('div');
    statsContainer.id = 'stats-container';
    statsContainer.style.position = 'absolute';
    statsContainer.style.top = '10px';
    statsContainer.style.right = '10px';
    statsContainer.style.width = '180px';
    
    const timeRow = document.createElement('div');
    timeRow.style.display = 'flex';
    timeRow.style.alignItems = 'center';
    timeRow.style.marginBottom = '8px';
    timeRow.style.justifyContent = 'space-between';
    
    const timeLabel = document.createElement('span');
    timeLabel.textContent = 'Time:';
    timeLabel.style.color = '#ddd';
    timeLabel.style.fontSize = '14px';
    timeLabel.style.width = '50px';
    
    const timeBarContainer = document.createElement('div');
    timeBarContainer.style.width = '80px';
    timeBarContainer.style.height = '12px';
    timeBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    timeBarContainer.style.border = '1px solid rgba(255, 255, 255, 0.3)';
    timeBarContainer.style.borderRadius = '6px';
    timeBarContainer.style.overflow = 'hidden';
    
    const timeEnergyBar = document.createElement('div');
    timeEnergyBar.id = 'time-energy-bar';
    timeEnergyBar.style.height = '100%';
    timeEnergyBar.style.width = '100%';
    timeEnergyBar.style.background = 'linear-gradient(90deg, #00ffff, #0088ff)';
    timeEnergyBar.style.transition = 'width 0.3s';
    
    const timeEnergyValue = document.createElement('span');
    timeEnergyValue.id = 'time-energy-value';
    timeEnergyValue.textContent = gameState.timeEnergy;
    timeEnergyValue.style.color = '#fff';
    timeEnergyValue.style.fontSize = '14px';
    timeEnergyValue.style.width = '35px';
    timeEnergyValue.style.textAlign = 'right';
    
    const powerRow = document.createElement('div');
    powerRow.style.display = 'flex';
    powerRow.style.alignItems = 'center';
    powerRow.style.marginBottom = '8px';
    powerRow.style.justifyContent = 'space-between';
    
    const powerLabel = document.createElement('span');
    powerLabel.textContent = 'Power:';
    powerLabel.style.color = '#ddd';
    powerLabel.style.fontSize = '14px';
    powerLabel.style.width = '50px';
    
    const powerBarContainer = document.createElement('div');
    powerBarContainer.style.width = '80px';
    powerBarContainer.style.height = '12px';
    powerBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    powerBarContainer.style.border = '1px solid rgba(255, 255, 255, 0.3)';
    powerBarContainer.style.borderRadius = '6px';
    powerBarContainer.style.overflow = 'hidden';
    
    const powerBar = document.createElement('div');
    powerBar.id = 'power-bar';
    powerBar.style.height = '100%';
    powerBar.style.width = '25%';
    powerBar.style.background = 'linear-gradient(90deg, #ffff00, #ff8800)';
    powerBar.style.transition = 'width 0.3s';
    
    const powerValue = document.createElement('span');
    powerValue.id = 'power-value';
    powerValue.textContent = gameState.power.toFixed(1);
    powerValue.style.color = '#fff';
    powerValue.style.fontSize = '14px';
    powerValue.style.width = '35px';
    powerValue.style.textAlign = 'right';
    
    const progressContainer = document.createElement('div');
    progressContainer.id = 'progress-container';
    progressContainer.style.position = 'absolute';
    progressContainer.style.bottom = '10px';
    progressContainer.style.left = '50%';
    progressContainer.style.transform = 'translateX(-50%)';
    progressContainer.style.width = '80%';
    
    const progressBorder = document.createElement('div');
    progressBorder.style.width = '100%';
    progressBorder.style.height = '15px';
    progressBorder.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    progressBorder.style.border = '2px solid rgba(255, 255, 255, 0.4)';
    progressBorder.style.borderRadius = '0';
    progressBorder.style.overflow = 'hidden';
    progressBorder.style.position = 'relative';
    
    const progressBar = document.createElement('div');
    progressBar.id = 'progress-bar';
    progressBar.style.height = '100%';
    progressBar.style.width = '0%';
    progressBar.style.background = 'linear-gradient(90deg, #ff0088, #ff00ff)';
    progressBar.style.position = 'absolute';
    progressBar.style.left = '0';
    progressBar.style.top = '0';
    
    timeBarContainer.appendChild(timeEnergyBar);
    powerBarContainer.appendChild(powerBar);
    
    timeRow.appendChild(timeLabel);
    timeRow.appendChild(timeBarContainer);
    timeRow.appendChild(timeEnergyValue);
    
    powerRow.appendChild(powerLabel);
    powerRow.appendChild(powerBarContainer);
    powerRow.appendChild(powerValue);
    
    statsContainer.appendChild(timeRow);
    statsContainer.appendChild(powerRow);
    
    progressBorder.appendChild(progressBar);
    progressContainer.appendChild(progressBorder);
    
    gameUI.appendChild(scoreDisplay);
    gameUI.appendChild(livesContainer);
    gameUI.appendChild(bombsContainer);
    gameUI.appendChild(statsContainer);
    gameUI.appendChild(progressContainer);
    
    document.getElementById('game-container').appendChild(gameUI);
    
    updateLivesDisplay();
    updateBombsDisplay();
    updateTimeEnergyBar();
    updatePowerBar();
}

function updateLivesDisplay() {
    const livesContainer = document.getElementById('lives-container');
    if (!livesContainer) return;
    
    livesContainer.innerHTML = '';
    
    for (let i = 0; i < gameState.lives; i++) {
        const lifeIcon = document.createElement('img');
        lifeIcon.src = './model/heart.png';
        lifeIcon.style.width = '25px';
        lifeIcon.style.height = '25px';
        lifeIcon.style.marginRight = '5px';
        lifeIcon.style.filter = 'drop-shadow(0 0 3px rgba(255, 0, 0, 0.7))';
        livesContainer.appendChild(lifeIcon);
    }
}

function updateBombsDisplay() {
    const bombsContainer = document.getElementById('bombs-container');
    if (!bombsContainer) return;
    
    bombsContainer.innerHTML = '';
    
    for (let i = 0; i < gameState.bombs; i++) {
        const bombIcon = document.createElement('img');
        bombIcon.src = './model/bomb.png';
        bombIcon.style.width = '25px';
        bombIcon.style.height = '25px';
        bombIcon.style.marginRight = '5px';
        bombIcon.style.filter = 'drop-shadow(0 0 3px rgba(255, 0, 0, 0.7))';
        bombsContainer.appendChild(bombIcon);
    }
}

function updateTimeEnergyBar() {
    const energyBar = document.getElementById('time-energy-bar');
    const energyValue = document.getElementById('time-energy-value');
    if (!energyBar || !energyValue) return;
    
    const percentage = (gameState.timeEnergy / gameState.maxTimeEnergy) * 100;
    
    energyBar.style.width = `${percentage}%`;
    energyValue.textContent = Math.round(gameState.timeEnergy);
}

// 3. Zmiana działania paska power - różne kolory dla różnych poziomów mocy
function updatePowerBar() {
    const powerBar = document.getElementById('power-bar');
    const powerValue = document.getElementById('power-value');
    if (!powerBar || !powerValue) return;
    
    const powerLevel = Math.floor(gameState.power);
    let percentage = 0;
    let powerColor = '';
    let powerText = powerLevel.toString();
    
    // Określenie koloru i procentowego wypełnienia w zależności od poziomu mocy
    if (powerLevel <= 5) {
        // Tryb 1: poziomy 1-5 (niebieski)
        percentage = (powerLevel / 5) * 100;
        powerColor = 'linear-gradient(90deg, #00c3ff, #0088ff)';
    } else if (powerLevel <= 10) {
        // Tryb 2: poziomy 6-10 (zielony)
        percentage = ((powerLevel - 5) / 5) * 100;
        powerColor = 'linear-gradient(90deg, #00ff88, #00aa44)';
    } else if (powerLevel <= 15) {
        // Tryb 3: poziomy 11-15 (pomarańczowy)
        percentage = ((powerLevel - 10) / 5) * 100;
        powerColor = 'linear-gradient(90deg, #ffcc00, #ff8800)';
    } else {
        // Tryb 4: MAX (czerwony)
        percentage = 100;
        powerColor = 'linear-gradient(90deg, #ff0055, #ff0000)';
        powerText = 'MAX';
    }
    
    powerBar.style.width = `${percentage}%`;
    powerBar.style.background = powerColor;
    powerValue.textContent = powerText;
}

function updateProgressBar() {
    if (gameState.bossPhase) return;
    
    const progressBar = document.getElementById('progress-bar');
    if (!progressBar) return;
    
    // Wolniejsze wypełnianie paska postępu (zmniejszone tempo)
    gameState.gameProgress += 1/60/240; // Zmienione z 120 na 240 - dwa razy wolniej
    
    if (gameState.gameProgress >= 1) {
        gameState.gameProgress = 1;
        startBossPhase();
    }
    
    const progressWidth = gameState.gameProgress * 100;
    progressBar.style.width = `${progressWidth}%`;
    
    if (progressWidth > 0) {
        const flickerIntensity = (Math.sin(Date.now() / 100) + 1) / 2;
        progressBar.style.boxShadow = `0 0 ${5 + flickerIntensity * 10}px #ff00ff`;
    }
}

function startBossPhase() {
    gameState.bossPhase = true;
    boss = new Boss(CANVAS_WIDTH / 2, -100, 100, 100, 3, images.boss);
}

function spawnEnemy() {
    if (gameState.bossPhase) return;
    
    const x = randomBetween(50, CANVAS_WIDTH - 50);
    const y = -50;
    const type = Math.random() > 0.5 ? 'enemy1' : 'enemy2';
    const image = type === 'enemy1' ? images.enemy1 : images.enemy2;
    const pattern = Math.random() > 0.7 ? 'spread' : 'basic';
    
    enemies.push(new Enemy(x, y, 40, 40, 2, image, 3, 100, pattern));
}

function spawnPowerUp(x, y) {
    const random = Math.random();
    let type;
    
    if (random < 0.6) {
        type = 'power';
    } else if (random < 0.85) {
        type = 'heart';
    } else {
        type = 'bomb';
    }
    
    powerups.push(new PowerUp(x, y, type));
}

function checkCollisions() {
    playerBullets.forEach(bullet => {
        enemies.forEach(enemy => {
            if (distance(bullet.x, bullet.y, enemy.x, enemy.y) < (enemy.width / 2 + bullet.width / 2)) {
                enemy.health--;
                bullet.markedForDeletion = true;
                
                if (enemy.health <= 0) {
                    enemy.markedForDeletion = true;
                    gameState.score += enemy.pointValue;
                    document.getElementById('score-display').textContent = `Score: ${gameState.score}`;
                    
                    if (Math.random() < 0.3) {
                        spawnPowerUp(enemy.x, enemy.y);
                    }
                }
            }
        });
        
        if (boss && distance(bullet.x, bullet.y, boss.x, boss.y) < (boss.width / 2 + bullet.width / 2)) {
            boss.health -= 1;
            bullet.markedForDeletion = true;
            
            if (boss.health <= 0) {
                boss = null;
                gameState.score += 10000;
                document.getElementById('score-display').textContent = `Score: ${gameState.score}`;
                gameState.gameWon = true;
                audio.win.play();
            }
        }
    });
    
    if (player && player.invulnerable <= 0) {
        for (let i = 0; i < enemyBullets.length; i++) {
            const bullet = enemyBullets[i];
            if (distance(bullet.x, bullet.y, player.x, player.y) < player.hitboxRadius) {
                bullet.markedForDeletion = true;
                playerHit();
                break;
            }
        }
        
        // Dodany kod dla kolizji z przeciwnikami
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (distance(enemy.x, enemy.y, player.x, player.y) < (enemy.width / 2 + player.hitboxRadius)) {
                playerHit();
                break;
            }
        }
        
        // Kolizja z bossem
        if (boss && distance(boss.x, boss.y, player.x, player.y) < (boss.width / 2 + player.hitboxRadius)) {
            playerHit();
        }
    }
}

function playerHit() {
    gameState.lives--;
    updateLivesDisplay();
    
    audio.die.currentTime = 0;
    audio.die.play();
    
    if (gameState.power > 1) {
        gameState.power--;
        updatePowerBar();
    }
    
    player.invulnerable = 2;
    
    if (gameState.lives <= 0) {
        gameOver(false);
    } else {
        player.x = CANVAS_WIDTH / 2;
        player.y = CANVAS_HEIGHT - 100;
    }
}

function gameOver(won) {
    if (!gameState.running) return; // Prevent multiple calls
    
    gameState.gameWon = won;
    gameState.running = false;
    
    // Store the final score before removing UI
    const finalScore = gameState.score;
    
    // Remove the game UI elements
    const existingUI = document.getElementById('game-ui');
    if (existingUI) {
        existingUI.remove();
    }
    
    // Natychmiast zmień ekran na gameover
    gameMenu.setFinalScore(finalScore);
    gameMenu.currentScreen = 'gameover';
    
    // Pozostała część funkcji wykonaj po opóźnieniu
    setTimeout(() => {
        if (won) {
            audio.win.play();
        } else {
            audio.lose.play();
        }
        
        audio.gameMusic.pause();
        
        // Zapisz wynik i pokaż formularz do wprowadzenia nicku
        saveHighScore(finalScore);
    }, 100);
}

// 2. Modyfikacja struktury highScores aby uwzględniała nick gracza
function saveHighScore(score) {
    // Tymczasowo przechowaj wynik do momentu wprowadzenia nicku
    gameState.lastScore = score;
    
    // Pokaż formularz do wprowadzenia nazwy gracza
    showNameInputForm();
}

// Nowa funkcja do wyświetlania formularza nicku
function showNameInputForm() {
    // Stwórz i dodaj formularz do strony
    const formContainer = document.createElement('div');
    formContainer.id = 'name-input-container';
    formContainer.style.position = 'absolute';
    formContainer.style.top = '40%';
    formContainer.style.left = '50%';
    formContainer.style.transform = 'translate(-50%, -50%)';
    formContainer.style.padding = '20px';
    formContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    formContainer.style.border = '2px solid #ff0055';
    formContainer.style.borderRadius = '8px';
    formContainer.style.zIndex = '1000';
    formContainer.style.textAlign = 'center';
    formContainer.style.boxShadow = '0 0 20px rgba(255, 0, 85, 0.6)';
    
    const header = document.createElement('h2');
    header.textContent = 'Enter your name:';
    header.style.color = '#ffffff';
    header.style.fontFamily = 'Orbitron, sans-serif';
    header.style.fontSize = '24px';
    header.style.marginBottom = '15px';
    
    const form = document.createElement('form');
    form.onsubmit = function(e) {
        e.preventDefault();
        const nameInput = document.getElementById('player-name-input');
        const playerName = nameInput.value.trim() || 'Player';
        submitHighScore(playerName, gameState.lastScore);
        formContainer.remove();
    };
    
    const input = document.createElement('input');
    input.id = 'player-name-input';
    input.type = 'text';
    input.placeholder = 'Your name';
    input.maxLength = 15;
    input.required = true;
    input.style.padding = '8px 12px';
    input.style.width = '100%';
    input.style.fontFamily = 'Orbitron, sans-serif';
    input.style.fontSize = '16px';
    input.style.marginBottom = '15px';
    input.style.borderRadius = '4px';
    input.style.backgroundColor = '#222';
    input.style.color = '#fff';
    input.style.border = '1px solid #444';
    input.style.outline = 'none';
    input.style.boxSizing = 'border-box';
    input.focus();
    
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Submit';
    submitButton.style.padding = '8px 20px';
    submitButton.style.fontFamily = 'Orbitron, sans-serif';
    submitButton.style.fontSize = '16px';
    submitButton.style.backgroundColor = '#ff0055';
    submitButton.style.color = '#fff';
    submitButton.style.border = 'none';
    submitButton.style.borderRadius = '4px';
    submitButton.style.cursor = 'pointer';
    submitButton.style.transition = 'background-color 0.2s';
    
    submitButton.onmouseover = function() {
        this.style.backgroundColor = '#ff3377';
    };
    submitButton.onmouseout = function() {
        this.style.backgroundColor = '#ff0055';
    };
    
    form.appendChild(input);
    form.appendChild(submitButton);
    formContainer.appendChild(header);
    formContainer.appendChild(form);
    
    document.getElementById('game-container').appendChild(formContainer);
    
    // Ustaw focus na polu input po dodaniu do DOM
    setTimeout(() => input.focus(), 100);
}

// Nowa funkcja do zapisywania wyniku z imieniem gracza
function submitHighScore(playerName, score) {
    let highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    
    highScores.push({
        name: playerName,
        score: score,
        date: new Date().toLocaleDateString()
    });
    
    highScores.sort((a, b) => b.score - a.score);
    
    if (highScores.length > 10) {
        highScores = highScores.slice(0, 10);
    }
    
    localStorage.setItem('highScores', JSON.stringify(highScores));
    
    if (gameMenu) {
        gameMenu.loadHighScores();
    }
}

let lastTime = 0;
let enemySpawnTimer = 0;
let enemySpawnInterval = 1.0; // Zmniejszone z 1.5 na 1.0 - więcej przeciwników

function gameLoop(timestamp) {
       const deltaTime = (timestamp - lastTime) / 1000 * 0.8; // Spowolnienie gry o 20%
    lastTime = timestamp;
    
    if (!gameState.running) {
        gameMenu.render();
    } else if (gameState.running && !gameState.paused) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        const bgWidth = background.image.width || CANVAS_WIDTH;
        const bgHeight = background.image.height || CANVAS_HEIGHT;
        
        const scaleFactor = Math.max(CANVAS_WIDTH / bgWidth, CANVAS_HEIGHT / bgHeight);
        const scaledWidth = bgWidth * scaleFactor;
        const scaledHeight = bgHeight * scaleFactor;
        
        const offsetX = (CANVAS_WIDTH - scaledWidth) / 2;
        
        background.y += background.speed;
        if (background.y >= scaledHeight) {
            background.y = 0;
        }
        
        ctx.drawImage(
            background.image, 
            offsetX, background.y - scaledHeight,
            scaledWidth, scaledHeight
        );
        ctx.drawImage(
            background.image,
            offsetX, background.y,
            scaledWidth, scaledHeight
        );
        
        player.update(deltaTime);
        
        if (keys.shift && gameState.timeEnergy > 0) {
            if (!gameState.timeShiftActive) {
                audio.timeShift.currentTime = 0;
                audio.timeShift.play();
            }
            gameState.timeShiftActive = true;
            gameState.timeEnergy -= 25 * deltaTime;
            
            if (gameState.timeEnergy <= 0) {
                gameState.timeEnergy = 0;
                gameState.timeShiftActive = false;
            }
        } else {
            gameState.timeShiftActive = false;
            gameState.timeEnergy += 2 * deltaTime;
            
            if (gameState.timeEnergy > gameState.maxTimeEnergy) {
                gameState.timeEnergy = gameState.maxTimeEnergy;
            }
        }
        
        updateTimeEnergyBar();
        
        if (gameState.timeShiftActive) {
            ctx.fillStyle = 'rgba(0, 100, 255, 0.1)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
        
        enemySpawnTimer += deltaTime;
        if (enemySpawnTimer >= enemySpawnInterval && !gameState.bossPhase) {
            spawnEnemy();
            enemySpawnTimer = 0;
        }
        
        updateProgressBar();
        
        if (boss) {
            boss.update(deltaTime);
            boss.draw();
        }
        
        playerBullets.forEach(bullet => {
            bullet.update(deltaTime);
            bullet.draw();
        });
        
        enemyBullets.forEach(bullet => {
                        bullet.update(deltaTime);
            bullet.draw();
        });
        
        enemies.forEach(enemy => {
            enemy.update(deltaTime);
            enemy.draw();
        });
        
        powerups.forEach(powerup => {
            powerup.update();
            powerup.draw();
        });
        
        player.draw();
        
        checkCollisions();
        
        playerBullets = playerBullets.filter(bullet => !bullet.markedForDeletion);
        enemyBullets = enemyBullets.filter(bullet => !bullet.markedForDeletion);
        enemies = enemies.filter(enemy => !enemy.markedForDeletion);
        powerups = powerups.filter(powerup => !powerup.markedForDeletion);
        
        // Check if score-display exists before trying to update it
        const scoreDisplay = document.getElementById('score-display');
        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${gameState.score}`;
        }
        
        if (gameState.gameWon) {
            gameOver(true);
        }
    }
    
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':
            keys.up = true;
            break;
        case 'ArrowDown':
            keys.down = true;
            break;
        case 'ArrowLeft':
            keys.left = true;
            break;
        case 'ArrowRight':
            keys.right = true;
            break;
        case 'Shift':
            keys.shift = true;
            break;
        case 'z':
        case 'Z':
            keys.z = true;
            break;
        case 'c':
        case 'C':
            keys.c = true;
            break;
        case 'Escape':
            if (gameState.running) {
                gameState.paused = !gameState.paused;
            }
            break;
    }
});

document.addEventListener('keyup', e => {
    switch (e.key) {
        case 'ArrowUp':
            keys.up = false;
            break;
        case 'ArrowDown':
            keys.down = false;
            break;
        case 'ArrowLeft':
            keys.left = false;
            break;
        case 'ArrowRight':
            keys.right = false;
            break;
        case 'Shift':
            keys.shift = false;
            break;
        case 'z':
        case 'Z':
            keys.z = false;
            break;
        case 'c':
        case 'C':
            keys.c = false;
            break;
    }
});

function initializeVolumeSettings() {
    const savedMusicVolume = localStorage.getItem('musicVolume');
    const savedSfxVolume = localStorage.getItem('sfxVolume');
    
    if (savedMusicVolume !== null) {
        musicVolume = parseFloat(savedMusicVolume);
    }
    
    if (savedSfxVolume !== null) {
        sfxVolume = parseFloat(savedSfxVolume);
    }
    
    updateVolumes();
}

window.onload = function() {
    initializeVolumeSettings();
    
    gameMenu = new GameMenu(canvas, ctx);
    
    gameMenu.setGameStartCallback(function(characterIndex) {
        gameState.characterSelected = characterIndex;
        initGame();
        
        audio.mainMenu.pause();
        audio.gameMusic.currentTime = 0;
        audio.gameMusic.play();
    });
    
    audio.mainMenu.play();
    
    requestAnimationFrame(gameLoop);
};

// Przeniesienie funkcji createBombAnimation poza klasę Player
function createBombAnimation() {
    // Tworzenie warstwy animacji
    const animationLayer = document.createElement('div');
    animationLayer.style.position = 'absolute';
    animationLayer.style.top = '0';
    animationLayer.style.left = '0';
    animationLayer.style.width = '100%';
    animationLayer.style.height = '100%';
    animationLayer.style.zIndex = '100';
    animationLayer.style.pointerEvents = 'none';
    
    // Dodanie fali uderzeniowej
    const shockwave = document.createElement('div');
    shockwave.style.position = 'absolute';
    shockwave.style.top = '50%';
    shockwave.style.left = '50%';
    shockwave.style.transform = 'translate(-50%, -50%)';
    shockwave.style.width = '10px';
    shockwave.style.height = '10px';
    shockwave.style.borderRadius = '50%';
    shockwave.style.background = 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,150,0,0.7) 50%, rgba(255,0,0,0) 100%)';
    shockwave.style.boxShadow = '0 0 50px 20px rgba(255,100,0,0.8)';
    shockwave.style.opacity = '0.9';
    shockwave.style.transition = 'all 0.5s ease-out';
    
    // Dodanie efektu błysku
    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = 'rgba(255,255,255,0.8)';
    flash.style.opacity = '1';
    flash.style.transition = 'opacity 0.3s ease-out';
    
    animationLayer.appendChild(shockwave);
    animationLayer.appendChild(flash);
    document.getElementById('game-container').appendChild(animationLayer);
    
    // Animacja błysku
    setTimeout(() => {
        flash.style.opacity = '0';
    }, 50);
    
    // Animacja fali uderzeniowej
    setTimeout(() => {
        shockwave.style.width = '150vw';
        shockwave.style.height = '150vw';
        shockwave.style.opacity = '0';
    }, 50);
    
    // Usunięcie warstwy animacji po zakończeniu
    setTimeout(() => {
        animationLayer.remove();
    }, 600);
}
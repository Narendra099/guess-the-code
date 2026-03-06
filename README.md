# CodeMaster - Guess the Secret Code

CodeMaster is a web-based logic puzzle game built with Django where your goal is to crack a secret numerical code using logic and deductions. It features a sleek, modern interface with neon effects and glassmorphic elements.

## Features

- **Multiple Difficulties**:
  - **Easy**: Digits from 1-6, 12 attempts
  - **Normal**: Digits from 1-8, 10 attempts
  - **Hard**: Digits from 1-9, 8 attempts
- **Input Modes**:
  - **Text Mode**: Type your guesses using your keyboard.
  - **Voice Mode**: Speak your guesses using your microphone for a hands-free experience.
- **Visual Clues (Classic Mastermind rules)**: 
  - 🟢 **Greens**: Correct digit in the **CORRECT** position.
  - 🔵 **Blues**: Correct digit in the **WRONG** position.
- **Responsive Design**: Beautiful neon and glassmorphic UI that works perfectly on desktop and mobile devices.

## How to Play

1. Start the game, then choose your difficulty level and preferred input mode.
2. The CodeMaster will generate a secret code consisting of unique digits.
3. Enter your guess and receive color-coded clues (Greens and Blues) to help you deduce the correct code.
4. Keep guessing until you crack the code or run out of attempts!
5. 🎯 **Goal:** Get all Greens to win!

## Tech Stack

- **Backend**: Python, Django
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Custom CSS focused on modern aesthetics (glassmorphism, neon glows).

## Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd "Guess the CODE"
   ```

2. **Set up a virtual environment (optional but recommended)**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```

3. **Install dependencies**:
   ```bash
   pip install django
   # Or using requirements.txt if available:
   # pip install -r requirements.txt
   ```

4. **Run database migrations**:
   ```bash
   python manage.py migrate
   ```

5. **Start the development server**:
   ```bash
   python manage.py runserver
   ```

6. Open your browser and navigate to `http://127.0.0.1:8000/` to play the game!

## Project Structure

- `codemaster_project/`: Main Django project configuration and settings.
- `game/`: The core Django app containing the game's views, URLs, templates, and static assets.
  - `templates/game/index.html`: Main game interface structure.
  - `static/game/style.css`: UI styling and animations.
  - `static/game/script.js`: Client-side game logic, state management, and interactions.

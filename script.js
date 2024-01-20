// script.js

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('game-container');
    const buttons = [];
    let columnSums, columnBombs, rowSums, rowBombs, tiles, score, totalScore = 0;
    refreshGame();
    
    function refreshGame() {
        container.innerHTML = '';
        tiles = Array.from({ length: 25 }, () => getRandomInt(0, 3));
        columnSums = [0, 0, 0, 0, 0];
        columnBombs = [0, 0, 0, 0, 0];
        rowSums = [0, 0, 0, 0, 0];
        rowBombs = [0, 0, 0, 0, 0];
        score = 100;

        for (let i = 0; i < 25; i++) {
            columnSums[i % 5] += tiles[i];
            rowSums[Math.floor(i / 5)] += tiles[i];
            if (tiles[i] == 0) {
                columnBombs[i % 5]++;
                rowBombs[Math.floor(i / 5)]++;
            }
        }
        
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        
        // Initialize the game grid
        for (let i = 0; i < 35; i++) {
            let fixedIndex = fixIndex(i);
            if (fixedIndex >= 0) {
                const button = document.createElement('button');
                button.className = 'game-square game-button';
                button.addEventListener('click', () => handleButtonClick(button, fixedIndex));
                button.addEventListener('contextmenu', (e) => handleRightClick(e, button));
                container.appendChild(button);
                buttons.push(button);
            } else {
                const sumSquare = document.createElement('div');
                const scoreSum = document.createElement('div');
                const bombSum = document.createElement('div');
                sumSquare.className = 'game-square';
                scoreSum.className = 'sum-half sum-top';
                bombSum.className = 'sum-half sum-bottom';
                
                let sum, bombs;
                if (fixedIndex == -1) {
                    sum = rowSums[Math.floor(i / 6)];
                    bombs = rowBombs[Math.floor(i / 6)];
                } else {
                    sum = columnSums[i - 30];
                    bombs = columnBombs[i - 30];
                }
                scoreSum.innerHTML = sum;
                bombSum.innerHTML = `<img class="scaled-image" src="Voltorb.png">${bombs}`;
                
                sumSquare.appendChild(scoreSum);
                sumSquare.appendChild(bombSum);
                container.appendChild(sumSquare);
            }
        }
        
        const resetButton = document.getElementById('reset-button');
        resetButton.addEventListener('click', resetGame);
    }

    function fixIndex(index) {
        if (index % 6 == 5) return -1;  // rows
        if (index > 29) return -2;      // columns
        return Math.ceil(index - (index / 6)); // game grid
    }
  
    function handleButtonClick(button, index) {
        if (!button.classList.contains('flagged')) {

            score *= tiles[index];
            if (tiles[index] > 0) {
                button.textContent = tiles[index];
            } else {
                button.innerHTML = '<img class="scaled-image" src="Voltorb.png" alt="0">';
            }
            button.classList.add('pressed');
            button.disabled = true;
            
            // Update the content of the html with the score
            document.getElementById('score-value').textContent = score;
        }
    }

    function handleRightClick(event, button) {
        // Handle right-click behavior
        event.preventDefault(); // Prevent the default context menu
        button.classList.toggle('flagged'); // Toggle the 'flagged' class
      }
  
  
    function resetGame() {
        totalScore += score;
        refreshGame();
        // Update the content of the html with the score
        document.getElementById('score-value').textContent = 0;
        document.getElementById('total-score-value').textContent = totalScore;
    }
  });
  
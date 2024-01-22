// script.js

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('game-container');
    const resetButton = document.getElementById('reset-button');
    const showRulesButton1 = document.getElementById('show-rules-button1');
    const showRankButton1 = document.getElementById('show-rank-button1');
    const showScoreButton1 = document.getElementById('show-score-button1');
    const showRulesButton2 = document.getElementById('show-rules-button2');
    const showRankButton2 = document.getElementById('show-rank-button2');
    const showScoreButton2 = document.getElementById('show-score-button2');
    const showControlButton1 = document.getElementById('show-controls-button1');
    const showControlButton2 = document.getElementById('show-controls-button2');
    const rulesSidebar = document.getElementById('rules-sidebar');
    const scoreSidebar = document.getElementById('score-sidebar');
    const rankSidebar = document.getElementById('rank-sidebar');
    const controlsSidebar = document.getElementById('controls-sidebar');
    let buttons = [], markupButton;
    let columnSums, columnBombs, rowSums, rowBombs, tiles, score, totalScore = 0, rounds = 1, level = 0, levels, highScores, levelData, tilesFlipped, selected, lastSelected;
    
    resetButton.addEventListener('click', () => {
        resetButton.blur();
        endMatch();
    });
    showRulesButton1.addEventListener('click', () => showRulesSidebar(showRulesButton1));
    showRankButton1.addEventListener('click', () => showRankSidebar(showRankButton1));
    showScoreButton1.addEventListener('click', () => showScoreSidebar(showScoreButton1));
    showRulesButton2.addEventListener('click', () => showRulesSidebar(showRulesButton2));
    showRankButton2.addEventListener('click', () => showRankSidebar(showRankButton2));
    showScoreButton2.addEventListener('click', () => showScoreSidebar(showScoreButton2));
    showControlButton1.addEventListener('click', () => showControlsSidebar(showControlButton1));
    showControlButton2.addEventListener('click', () => showControlsSidebar(showControlButton2));
    document.addEventListener('keydown', () => handleKeypress(event.key));
    
    loadData();
    
    function showRulesSidebar(button) {
        button.blur();
        rulesSidebar.style.display = 'block';
        scoreSidebar.style.display = 'none';
        rankSidebar.style.display = 'none';
        controlsSidebar.style.display = 'none';
    }
    function showScoreSidebar(button) {
        button.blur();
        scoreSidebar.style.display = 'block';
        rulesSidebar.style.display = 'none';
        rankSidebar.style.display = 'none';
        controlsSidebar.style.display = 'none';
    }
    function showRankSidebar(button) {
        button.blur();
        rankSidebar.style.display = 'block';
        scoreSidebar.style.display = 'none';
        rulesSidebar.style.display = 'none';
        controlsSidebar.style.display = 'none';
    }
    function showControlsSidebar(button) {
        button.blur();
        controlsSidebar.style.display = 'block';
        rankSidebar.style.display = 'none';
        scoreSidebar.style.display = 'none';
        rulesSidebar.style.display = 'none';
    }

    
    function loadData() {
        // Fetch the JSON file
        fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Access the array from the object
            levels = data.levels;
            highScores = data.topScores;
            refreshGame();
        })
        .catch(error => {
            console.error('Error fetching the JSON file:', error);
        });
    }
    
    function refreshGame() {
        container.innerHTML = '';
        buttons = [], tiles = [];
        columnSums = [0, 0, 0, 0, 0];
        columnBombs = [0, 0, 0, 0, 0];
        rowSums = [0, 0, 0, 0, 0];
        rowBombs = [0, 0, 0, 0, 0];
        score = 1, tilesFlipped = 0, lastSelected = selected = 12;
        
        // Set tiles from json data
        levelData = levels[level][getRandomInt(0, 4)];
        for (let i = 0; i < levelData[0]; i++) tiles.push(2);
        for (let i = 0; i < levelData[1]; i++) tiles.push(3);
        for (let i = 0; i < levelData[2]; i++) tiles.push(0);
        for (let i = tiles.length; i < 25; i++) tiles.push(1);
        tiles = shuffleArray(tiles);
        console.log(tiles);
        
        // Sum tile data
        for (let i = 0; i < 25; i++) {
            columnSums[i % 5] += tiles[i];
            rowSums[Math.floor(i / 5)] += tiles[i];
            if (tiles[i] == 0) {
                columnBombs[i % 5]++;
                rowBombs[Math.floor(i / 5)]++;
            }
        }
        
        // Initialize the game grid
        for (let i = 0; i < 35; i++) {
            let adjustedIndex = adjustIndex(i);
            if (adjustedIndex >= 0) {
                container.appendChild(getGameSquare(adjustedIndex));
            } else {
                container.appendChild(getSumSquare(i));
            }
        }
        container.appendChild(getMarkupSquare());
        buttons[selected].classList.toggle('selected');
    }
    
    function getGameSquare(adjustedIndex) {
        const button = document.createElement('button');
        button.className = 'game-square game-button image-container';
        button.addEventListener('click', () => handleButtonClick(button, adjustedIndex));
        button.addEventListener('contextmenu', (e) => handleRightClick(e, button));
        buttons.push(button);
        return button;
    }
    function getSumSquare(badIndex) {
        let sum, bombs, sumIndex;
        if (adjustIndex(badIndex) == -1) { // row sum
            sumIndex = Math.floor(badIndex / 6);
            sum = rowSums[sumIndex];
            bombs = rowBombs[sumIndex];
        } else { // column sum
            sumIndex = badIndex - 30;
            sum = columnSums[sumIndex];
            bombs = columnBombs[sumIndex];
        }
        const sumSquare = document.createElement('div');
        const scoreSum = document.createElement('div');
        const bombSum = document.createElement('div');
        
        sumSquare.className = 'game-square sum-square';
        if (sumIndex == 0) sumSquare.classList.toggle('red');
        if (sumIndex == 1) sumSquare.classList.toggle('green');
        if (sumIndex == 2) sumSquare.classList.toggle('orange');
        if (sumIndex == 3) sumSquare.classList.toggle('blue');
        if (sumIndex == 4) sumSquare.classList.toggle('violet');
        scoreSum.className = 'sum-half sum-top';
        bombSum.className = 'sum-half sum-bottom';
        scoreSum.innerHTML = sum;
        bombSum.innerHTML = `<img class="inline-image" src="assets/Voltorb.png" alt="Bombs ">${bombs}`;
        
        sumSquare.appendChild(scoreSum);
        sumSquare.appendChild(bombSum);
        return sumSquare;
    }
    function getMarkupSquare() {
        markupButton = document.createElement('button');
        markupButton.className = 'game-square markup-button image-container';
        let zero = '<img class="markup-zero" src="assets/Circle-faded.png">';
        let one = '<img class="markup-one" src="assets/One-faded.png">';
        let two = '<img class="markup-two" src="assets/Two-faded.png">';
        let three = '<img class="markup-three" src="assets/Three-faded.png">';
        markupButton.innerHTML += zero + one + two + three;
        markupButton.addEventListener('click', () => handleMarkupClick(markupButton));
        return markupButton;
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      }

    function adjustIndex(index) {
        if (index % 6 == 5) return -1;  // rows
        if (index > 29) return -2;      // columns
        return Math.ceil(index - (index / 6)); // game grid
    }

    function handleMarkupClick() {
        markupButton.blur();
        markupButton.classList.toggle('pressed');
        for (let i = 0; i < 25; i++) {
            buttons[i].classList.toggle('markup');
        }
        updateMarkupButton();
    }
    function handleButtonClick(button, index) {
        button.blur();
        selectTile(index);
        flipTile(index);
    }
    function handleRightClick(event, button) {
        // // Handle right-click behavior
        // event.preventDefault(); // Prevent the default context menu
        // button.classList.toggle('flagged'); // Toggle the 'flagged' class
        // let zero = '<img class="zero-marker" src="assets/circle.png">';
        // let one = '<img class="one-marker" src="assets/one.png">';
        // let two = '<img class="two-marker" src="assets/two.png">';
        // let three = '<img class="three-marker" src="assets/three.png">';
        // if (button.innerHTML.includes(zero)) {
        //     button.innerHTML = button.innerHTML.replace(zero, '');
        // } else {
        //     button.innerHTML += zero;
        // }
    }
    function handleKeypress(key) {
        // console.log('Keypressed: ', key);
        switch (key) {
            case 'w':
            case 'ArrowUp':
                keyUp();
                break;
            case 's':
            case 'ArrowDown':
                keyDown();
                break;
            case 'a':
            case 'ArrowLeft':
                keyLeft();
                break;
            case 'd':
            case 'ArrowRight':
                keyRight();
                break;
            case '`':
            case '0':
                markZero();
                break;
            case '1':
                markOne();
                break;
            case '2':
                markTwo();
                break;
            case '3':
                markThree();
                break;
            case 'x':
            case 'm':
                handleMarkupClick();
                break;
            case ' ':
            case 'Enter':
            case 'Return':
                flipTile(selected);
                break;
        }
    }

    function keyUp() {
        if (selected > 4) {
            selectTile(selected-5);
        }
    }
    function keyDown() {
        if (selected < 20) {
            selectTile(selected+5);
        }
    }
    function keyLeft() {
        if (selected > 0) {
            selectTile(selected-1);
        }
    }
    function keyRight() {
        if (selected < 24) {
            selectTile(selected+1);
        }
    }

    function markZero() {
        let button = buttons[selected];
        if (!button.classList.contains('pressed') && !button.innerHTML.includes('<img class="scaled-image overlay-image" src="assets/Voltorb.png" alt="0">')) {
            let zero = '<img class="zero-marker" src="assets/Circle.png">';
            if (button.innerHTML.includes(zero)) {
                button.innerHTML = button.innerHTML.replace(zero, '');
            } else {
                button.innerHTML += zero;
            }
            updateMarkupButton();
        }
    }
    function markOne() {
        let button = buttons[selected];
        if (!button.classList.contains('pressed') && !button.innerHTML.includes('<img class="scaled-image overlay-image" src="assets/Voltorb.png" alt="0">')) {
            let one = '<img class="one-marker" src="assets/One.png">';
            if (button.innerHTML.includes(one)) {
                button.innerHTML = button.innerHTML.replace(one, '');
            } else {
                button.innerHTML += one;
            }
            updateMarkupButton();
        }
    }
    function markTwo() {
        let button = buttons[selected];
        if (!button.classList.contains('pressed') && !button.innerHTML.includes('<img class="scaled-image overlay-image" src="assets/Voltorb.png" alt="0">')) {
            let two = '<img class="two-marker" src="assets/Two.png">';
            if (button.innerHTML.includes(two)) {
                button.innerHTML = button.innerHTML.replace(two, '');
            } else {
                button.innerHTML += two;
            }
            updateMarkupButton();
        }
    }
    function markThree() {
        let button = buttons[selected];
        if (!button.classList.contains('pressed') && !button.innerHTML.includes('<img class="scaled-image overlay-image" src="assets/Voltorb.png" alt="0">')) {
            let three = '<img class="three-marker" src="assets/Three.png">';
            if (button.innerHTML.includes(three)) {
                button.innerHTML = button.innerHTML.replace(three, '');
            } else {
                button.innerHTML += three;
            }
            updateMarkupButton();
        }
    }

    function updateMarkupButton() {
        if (markupButton.classList.contains('pressed')) {
            // If in markup mode
            let button = buttons[selected];
            if (button.innerHTML.includes('zero-marker')) {
                markupButton.innerHTML = markupButton.innerHTML.replace('Circle-faded.png', 'Circle.png');
            } else {
                markupButton.innerHTML = markupButton.innerHTML.replace('Circle.png', 'Circle-faded.png');
            }
            if (button.innerHTML.includes('one-marker')) {
                markupButton.innerHTML = markupButton.innerHTML.replace('One-faded.png', 'One.png');
            } else {
                markupButton.innerHTML = markupButton.innerHTML.replace('One.png', 'One-faded.png');
            }
            if (button.innerHTML.includes('two-marker')) {
                markupButton.innerHTML = markupButton.innerHTML.replace('Two-faded.png', 'Two.png');
            } else {
                markupButton.innerHTML = markupButton.innerHTML.replace('Two.png', 'Two-faded.png');
            }
            if (button.innerHTML.includes('three-marker')) {
                markupButton.innerHTML = markupButton.innerHTML.replace('Three-faded.png', 'Three.png');
            } else {
                markupButton.innerHTML = markupButton.innerHTML.replace('Three.png', 'Three-faded.png');
            }
        } else {
            markupButton.innerHTML = markupButton.innerHTML.replace('Circle.png', 'Circle-faded.png');
            markupButton.innerHTML = markupButton.innerHTML.replace('One.png', 'One-faded.png');
            markupButton.innerHTML = markupButton.innerHTML.replace('Two.png', 'Two-faded.png');
            markupButton.innerHTML = markupButton.innerHTML.replace('Three.png', 'Three-faded.png');
        }
    }

    function selectTile(index) {
        selected = index;
        buttons[selected].classList.toggle('selected');
        buttons[lastSelected].classList.toggle('selected');
        lastSelected = selected;
        updateMarkupButton();
    }
    function flipTile(index) {
        let button = buttons[index];
        if (!button.classList.contains('flagged') && !button.classList.contains('markup') && !button.innerHTML.includes('<img class="scaled-image overlay-image" src="assets/Voltorb.png" alt="0">')) {
            if (tiles[index] > 0) {
                button.innerHTML = '';
                button.textContent = tiles[index];
            } else {
                button.innerHTML = '<img class="scaled-image overlay-image" src="assets/Voltorb.png" alt="0">';
            }
            button.classList.add('pressed');
            button.disabled = true;
            
            // Update the content of the html with the score
            tilesFlipped++;
            score *= tiles[index];
            document.getElementById('score-value').textContent = score;
            
            // check if win or lose
            if (score == levelData[3]) {
                document.getElementById('reset-button').className = document.getElementById('reset-button').className.concat(' blue');
                revealBombs();
            } else if (score == 0) {
                document.getElementById('reset-button').className = document.getElementById('reset-button').className.concat(' red');
                revealBombs();
            }
        }
    }
    function revealBombs() {
        for (let i = 0; i < 25; i++) {
            if (tiles[i] == 0) {
                buttons[i].innerHTML += '<img class="scaled-image overlay-image" src="assets/Voltorb.png" alt="0">';
                buttons[i].style = "cursor: not-allowed; pointer-events: none;";
                // buttons[i].classList.add('flagged');
            }
        }
    }
  
    function endMatch() {
        if (tilesFlipped <= 0) return; 
        if (score == levelData[3]) { // win
            if (level < 8) level++;
        } else if (score == 0) { // loss
            level = Math.min(tilesFlipped-1, level);
        }
        totalScore += score;
        rounds++;
        refreshGame();
        // Update the content of the html with the score and stuff
        document.getElementById('reset-button').className = 'menu-button';
        document.getElementById('score-value').textContent = 0;
        document.getElementById('total-score-value').textContent = totalScore;
        document.getElementById('level-value').textContent = level+1;
        document.getElementById('round-value').textContent = rounds;
    }
  });
  
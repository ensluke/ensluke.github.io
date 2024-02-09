// script.js

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('game-container');
    const pageOrder = ['Score', 'Controls', 'Options', 'Ranks', 'Facts', 'Rules'];
    // General button bar
    const leftButton = document.getElementById('left-button');
    const middleButton = document.getElementById('middle-button');
    const rightButton = document.getElementById('right-button');
    // Options checkboxes
    const wraparoundCheckbox = document.getElementById('wraparound');
    const lockZeroesCheckbox = document.getElementById('lockZeroes');
    const autoMarkBombRowsCheckbox = document.getElementById('autoMarkBombRows');
    const autoClearSafeRowsCheckbox = document.getElementById('autoClearSafeRows');
    const randomModeCheckbox = document.getElementById('randomMode');

    // Game buttons
    let buttons = [], markupButton;
    // JSON data
    let levels, highScores, voltorbFacts, loseMessages;
    // Other Variables
    const shinyOdds = 512;
    let columnSums, columnBombs, rowSums, rowBombs, tiles, score, totalScore = 0, rounds = 1, level = 0, levelData, tilesFlipped, lastSelected = selected = 14;
    // State variables
    let gameState, pageState = 'Score', taintedRun, markupMode = false;
    // Options booleans
    let wraparound = true, lockZeroes = true, randomMode = false, autoMarkBombRows = true, autoClearSafeRows = true;


    initButtons();
    updatePage();
    loadData();


    /**
     * Based on the current page index, returns the previous.
     * @returns The previous page index
     */
    function getPreviousPageNo() {
        let pageNo = pageOrder.indexOf(pageState);
        let NoOfPages = pageOrder.length;
        if (pageNo == 0) {
            return NoOfPages-1;
        } else {
            return pageNo-1;
        }
    }
    /**
     * Based on the current page index, returns the next.
     * @returns The next page index
     */
    function getNextPageNo() {
        let pageNo = pageOrder.indexOf(pageState);
        let NoOfPages = pageOrder.length;
        if (pageNo == NoOfPages-1) {
            return 0;
        } else {
            return pageNo+1;
        }
    }

    /**
     * Handles the 'Previous' button, going to the previous page. 
     */
    function leftButtonClick() {
        leftButton.blur();
        pageState = pageOrder[getPreviousPageNo()];
        updatePage();
    }
    /**
     * Handles the 'Next' button, going to the next page. 
     */
    function rightButtonClick() {
        rightButton.blur();
        pageState = pageOrder[getNextPageNo()];
        updatePage();
    }
    /**
     * Handles the middle page button, performing various functions. 
     */
    function middleButtonClick() {
        middleButton.blur();
        switch (pageState) {
            case 'Controls':
                break;
            case 'Options':
                break;
            case 'Ranks':
                submitForm();
                break;
            case 'Rules':
                break;
            case 'Facts':
                updateFacts();
                break;
            case 'Score':
            default:
                endMatch();
                break;
        }
        shakeElement(middleButton);
    }

    /**
     * Updates the sidebar page to the current pageState. 
     */
    function updatePage() {
        // Get pages, and cancel displaying them 
        const pageTitle = document.getElementById('header-title');
        const scorePage = document.getElementById('score-page');
        scorePage.style.display = 'none';
        const controlsPage = document.getElementById('controls-page');
        controlsPage.style.display = 'none';
        const optionsPage = document.getElementById('options-page');
        optionsPage.style.display = 'none';
        const rulesPage = document.getElementById('rules-page');
        rulesPage.style.display = 'none';
        const factsPage = document.getElementById('facts-page');
        factsPage.style.display = 'none';
        const ranksPage = document.getElementById('ranks-page');
        ranksPage.style.display = 'none';
        // Update page
        pageTitle.innerHTML = pageState;
        middleButton.innerHTML = "";
        switch (pageState) {
            case 'Controls':
                controlsPage.style.display = 'block';
                break;
            case 'Options':
                optionsPage.style.display = 'block';
                break;
            case 'Ranks':
                ranksPage.style.display = 'block';
                middleButton.innerHTML = "Submit";
                pageTitle.innerHTML = "High Scores"
                updateRanks();
                break;
            case 'Rules':
                rulesPage.style.display = 'block';
                break;
            case 'Facts':
                factsPage.style.display = 'block';
                middleButton.innerHTML = "Feeling Lucky";
                updateFacts();
                break;
            default:
            case 'Score':
                scorePage.style.display = 'block';
                middleButton.innerHTML = "End Match";
                pageTitle.innerHTML = "Voltorb Flip v2.0"
                break;
        }
        // Update Button bar
        updateResetButton();
        leftButton.innerHTML = `< ${pageOrder[getPreviousPageNo()]}`;
        rightButton.innerHTML = `${pageOrder[getNextPageNo()]} >`;
    }
    
    /**
     * Initializes button event listeners. 
     */
    function initButtons() {
        leftButton.addEventListener('click', () => leftButtonClick());
        middleButton.addEventListener('click', () => middleButtonClick());
        rightButton.addEventListener('click', () => rightButtonClick());
        wraparoundCheckbox.addEventListener('change', () => {
            wraparoundCheckbox.blur();
            wraparound = wraparoundCheckbox.checked;
        });
        lockZeroesCheckbox.addEventListener('change', () => {
            lockZeroesCheckbox.blur();
            lockZeroes = lockZeroesCheckbox.checked;
        });
        autoClearSafeRowsCheckbox.addEventListener('change', () => {
            autoClearSafeRowsCheckbox.blur();
            autoClearSafeRows = autoClearSafeRowsCheckbox.checked;
        });
        autoMarkBombRowsCheckbox.addEventListener('change', () => {
            autoMarkBombRowsCheckbox.blur();
            autoMarkBombRows = autoMarkBombRowsCheckbox.checked;
        });
        document.addEventListener('keydown', () => handleKeypress(event.key));

        // Init popup listeners
        document.addEventListener('click', function(event) {
            const winPopup = document.getElementById('win-popup');
            const losePopup = document.getElementById('lose-popup');
        
            // Check if the clicked element is not inside the popup
            if (winPopup.contains(event.target) && winPopup.style.display === 'block') {
                closePopup();
            }
            if (losePopup.contains(event.target) && losePopup.style.display === 'block') {
                closePopup();
            }
        });
    }
    
    /**
     * Loads the JSON data. Then calls refreshGame().
     */
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
            voltorbFacts = data.voltorbFacts;
            loseMessages = data.loseMessages;
            refreshGame();
        })
        .catch(error => {
            console.error('Error fetching the JSON file:', error);
        });
    }

    /**
     * Submits the high score form. 
     */
    function submitForm() {
        let rankSegment = document.getElementById('rank-segment');
        
        rankSegment.innerHTML = "Name Score\n";
        rankSegment.innerHTML += document.getElementById('name').value + " : " + totalScore;
    }

    /**
     * Randomizes the current Voltorb fact from the JSON list. 
     */
    function updateFacts() {
        let factSegment = document.getElementById('fact-segment');
        factSegment.innerHTML = voltorbFacts[getRandomInt(0, voltorbFacts.length-1)];
    }
    /**
     * Updates the Ranks page. 
     */
    function updateRanks() {
        let rankSegment = document.getElementById('rank-segment');
        
        rankSegment.innerHTML = "Name Score\n";
        for (let i = 0; i < Math.min(10, highScores.length); i++) {
            rankSegment.innerHTML += `${highScores[i]}\n`;
        }
    }

    /**
     * Changes the Reset button colour based on win/lose condition. 
     */
    function updateResetButton() {
        if (pageState == 'Score' && gameState == 'win') {
            // document.getElementById('middle-button').className = document.getElementById('middle-button').className.concat(' blue');
            document.getElementById('middle-button').classList.toggle('blue', true);
        } else if (pageState == 'Score' && gameState == 'lose') {
            // document.getElementById('middle-button').className = document.getElementById('middle-button').className.concat(' red');
            document.getElementById('middle-button').classList.toggle('red', true);
        } else {
            document.getElementById('middle-button').classList.toggle('red', false);
            document.getElementById('middle-button').classList.toggle('blue', false);

        }
    }
    
    /**
     * Refreshes the entire game page, reinitializing the game grid and state. 
     * Does not update the level or total score. 
     */
    function refreshGame() {
        container.innerHTML = '';
        buttons = [], tiles = [];
        columnSums = [0, 0, 0, 0, 0];
        columnBombs = [0, 0, 0, 0, 0];
        rowSums = [0, 0, 0, 0, 0];
        rowBombs = [0, 0, 0, 0, 0];
        score = 1, tilesFlipped = 0, gameState = '';
        
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
            if (adjustIndex(i) >= 0) {
                container.appendChild(getGameSquare(i));
            } else {
                container.appendChild(getSumSquare(i));
            }
        }
        container.appendChild(getMarkupSquare());
        buttons[selected].classList.toggle('selected');
        
        // Auto mark bomb rows (if enabled)
        if (autoMarkBombRows) {
            let zero = '<img class="zero-marker" src="assets/Circle.png">';
            for (let i = 0; i < 5; i++) {
                if (rowBombs[i] == 5) {
                    for (let j = i*5; j < i*5+5; j++) {
                        let button = buttons[j];
                        let tileFace = button.querySelector('.game-square-front');
                        button.classList.toggle('flagged', true);
                        tileFace.innerHTML = zero;
                    }
                }
                if (columnBombs[i] == 5) {
                    for (let j = i; j < 25; j += 5) {
                        let button = buttons[j];
                        let tileFace = button.querySelector('.game-square-front');
                        button.classList.toggle('flagged', true);
                        tileFace.innerHTML = zero;
                    }
                }
            }
        }
    }

    /**
     * Creates a game square according to the specified index.
     * @param {int} index The index of this square
     * @returns The game square
     */
    function getGameSquare(index) {
        const button = document.createElement('button');
        const frontside = document.createElement('div');
        const backside = document.createElement('div');
        button.className = 'game-square game-button';
        frontside.className = 'game-square-front';
        backside.className = 'game-square-back';
        if (tiles[adjustIndex(index)] > 0) {
            backside.textContent = tiles[adjustIndex(index)];
        } else {
            // Shiny Randomizer
            if (getRandomInt(0, shinyOdds) == 0) {
                backside.innerHTML = '<img class="scaled-image overlay-image" src="assets/Voltorb-shiny.png" alt="0">';
            } else {
                backside.innerHTML = '<img class="scaled-image overlay-image" src="assets/Voltorb.png" alt="0">';
            }
        }
        button.appendChild(backside);
        button.appendChild(frontside);
        button.addEventListener('click', () => handleButtonClick(button, index));
        buttons.push(button);
        return button;
    }
    /**
     * Creates a row or column summary square based on its position in the grid.
     * @param {int} index The index of the square in the game grid
     * @returns The summary square
     */
    function getSumSquare(index) {
        let sum, bombs, sumIndex;
        if (index < 30) { // row sum
            sumIndex = Math.floor(index / 6);
            sum = rowSums[sumIndex];
            bombs = rowBombs[sumIndex];
        } else { // column sum
            sumIndex = index - 30;
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
        sumSquare.addEventListener('click', () => handleButtonClick(sumSquare, index));
        buttons.push(sumSquare);
        return sumSquare;
    }
    /**
     * Creates the markup square button.
     * @returns The markup square button
     */
    function getMarkupSquare() {
        markupButton = document.createElement('button');
        markupButton.className = 'game-square markup-button';
        let zero = '<img class="markup-zero" src="assets/Circle-faded.png">';
        let one = '<img class="markup-one" src="assets/One-faded.png">';
        let two = '<img class="markup-two" src="assets/Two-faded.png">';
        let three = '<img class="markup-three" src="assets/Three-faded.png">';
        markupButton.innerHTML += zero + one + two + three;
        markupButton.addEventListener('click', () => handleMarkupClick(markupButton));
        return markupButton;
    }

    /**
     * Generates a random integer between the bounds, inclusive.
     * @param {int} min The minimum, inclusive
     * @param {int} max The maximum, inclusive
     * @returns The random integer
     */
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Shuffles an array. 
     * @param {[]} array The array to shuffle
     * @returns The shuffled array
     */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      }

    /**
     * Returns the relative index of the position in the smaller grid based on the absolute index. 
     * @param {int} index The absolute index in the large game grid
     * @returns The adjusted index of the position in the smaller grid
     */
    function adjustIndex(index) {
        if (index % 6 == 5) return -1;  // rows
        if (index > 29) return -2;      // columns
        return Math.ceil(index - (index / 6)); // game grid
    }

    /**
     * Handles clikcing the markup button. 
     */
    function handleMarkupClick() {
        markupButton.blur();
        markupButton.classList.toggle('pressed');
        markupMode = markupButton.classList.contains("pressed");
        for (let i = 0; i < 35; i++) {
            buttons[i].classList.toggle('markup');
            buttons[i].classList.remove('highlight');
        }
        // Move selected if on a summary square invalidly
        if (adjustIndex(selected) < 0) selectTile(14);
        updateMarkupButton();
    }
    /**
     * Handles clicking a game button in the grid. 
     * @param {HTMLButtonElement} button The button clicked
     * @param {int} index The position of the button in the relative grid
     */
    function handleButtonClick(button, index) {
        button.blur();
        selectTile(index);
        flipTile(index);
    }
    /**
     * Handles keypresses, routing to the proper functions.
     * @param {*} key The key pressed
     */
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
                markZero(selected);
                break;
            case '1':
                markOne(selected);
                break;
            case '2':
                markTwo(selected);
                break;
            case '3':
                markThree(selected);
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
            case 'q':
                markZero(selected);
                markOne(selected);
                break;
        }
    }

    /**
     * Moves the selector up, potentially wrapping. 
     */
    function keyUp() {
        if (selected > 4) {
            if (selected == 5) {
                selectTile(29);
            } else {
                selectTile(selected-6);
            }
        } else if (wraparound) {
            selectTile(selected + (markupMode ? 30 : 24));
        }
    }
    /**
     * Moves the selector down, potentially wrapping. 
     */
    function keyDown() {
        if (selected < 24) {
            selectTile(selected+6);
        } else if (selected < 30) {
            if (markupMode) {
                if (selected == 29) {
                    selectTile(5);
                } else {
                    selectTile(selected+6);
                }
            } else if (wraparound) {
                selectTile(selected-24);
            }
        } else if (wraparound) {
            selectTile(selected-30);
        }
    }
    /**
     * Moves the selector left, potentially wrapping. 
     */
    function keyLeft() {
        if (selected % 6 == 0) {
            if (wraparound) {
                if (selected == 30) {
                    selectTile(34);
                } else {
                    selectTile(selected + (markupMode ? 5 : 4));
                }
            }
        } else if (selected > 0) {
            selectTile(selected-1);
        }
    }
    /**
     * Moves the selector right, potentially wrapping. 
     */
    function keyRight() {
        if (selected % 6 == 5) {
            if (wraparound) {
                selectTile(selected-5);
            }
        } else if (selected % 6 == 4 && !markupMode) {
            if (wraparound && !markupMode) {
                selectTile(selected-4);
            }
        } else if (selected < 34) {
            selectTile(selected+1);
        } else if (selected == 34) {
            selectTile(30);
        }
    }

    /**
     * Toggles the 'Zero' mark on the selected square, AKA the 'Circle' or 'Voltorb'. 
     */
    function markZero(index) {
        let button = buttons[index];
        if (button.classList.contains("game-button") && !button.classList.contains('pressed')) {
            const tileFace = button.querySelector('.game-square-front');
            let zero = '<img class="zero-marker" src="assets/Circle.png">';
            button.classList.toggle('flagged');
            if (tileFace.innerHTML.includes(zero)) {
                tileFace.innerHTML = tileFace.innerHTML.replace(zero, '');
            } else {
                tileFace.innerHTML += zero;
            }
            updateMarkupButton();
        } else if (markupMode && button.classList.contains("sum-square")) {
            if (adjustIndex(index) == -1) {
                // Mark row
                for (let i = index-5; i < index; i++) {
                    markZero(i);
                }
            } else if (adjustIndex(index) == -2) {
                // Mark column
                for (let i = index % 6; i < index; i += 6) {
                    markZero(i);
                }
            }
        }
    }
    /**
     * Toggles the 'One' mark on the selected square. 
     */
    function markOne(index) {
        let button = buttons[index];
        if (button.classList.contains("game-button") && !button.classList.contains('pressed')) {
            const tileFace = button.querySelector('.game-square-front');
            let one = '<img class="one-marker" src="assets/One.png">';
            if (tileFace.innerHTML.includes(one)) {
                tileFace.innerHTML = tileFace.innerHTML.replace(one, '');
            } else {
                tileFace.innerHTML += one;
            }
            updateMarkupButton();
        } else if (markupMode && button.classList.contains("sum-square")) {
            if (adjustIndex(index) == -1) {
                // Mark row
                for (let i = index-5; i < index; i++) {
                    markOne(i);
                }
            } else if (adjustIndex(index) == -2) {
                // Mark column
                for (let i = index % 6; i < index; i += 6) {
                    markOne(i);
                }
            }
        }
    }
    /**
     * Toggles the 'Two' mark on the selected square. 
     */
    function markTwo(index) {
        let button = buttons[index];
        if (button.classList.contains("game-button") && !button.classList.contains('pressed')) {
            const tileFace = button.querySelector('.game-square-front');
            let two = '<img class="two-marker" src="assets/Two.png">';
            if (tileFace.innerHTML.includes(two)) {
                tileFace.innerHTML = tileFace.innerHTML.replace(two, '');
            } else {
                tileFace.innerHTML += two;
            }
            updateMarkupButton();
        } else if (markupMode && button.classList.contains("sum-square")) {
            if (adjustIndex(index) == -1) {
                // Mark row
                for (let i = index-5; i < index; i++) {
                    markTwo(i);
                }
            } else if (adjustIndex(index) == -2) {
                // Mark column
                for (let i = index % 6; i < index; i += 6) {
                    markTwo(i);
                }
            }
        }
    }
    /**
     * Toggles the 'Three' mark on the selected square. 
     */
    function markThree(index) {
        let button = buttons[index];
        if (button.classList.contains("game-button") && !button.classList.contains('pressed')) {
            const tileFace = button.querySelector('.game-square-front');
            let three = '<img class="three-marker" src="assets/Three.png">';
            if (tileFace.innerHTML.includes(three)) {
                tileFace.innerHTML = tileFace.innerHTML.replace(three, '');
            } else {
                tileFace.innerHTML += three;
            }
            updateMarkupButton();
        } else if (markupMode && button.classList.contains("sum-square")) {
            if (adjustIndex(index) == -1) {
                // Mark row
                for (let i = index-5; i < index; i++) {
                    markZero(i);
                }
            } else if (adjustIndex(index) == -2) {
                // Mark column
                for (let i = index % 6; i < index; i += 6) {
                    markZero(i);
                }
            }
        }
    }

    /**
     * Updates the markup button to match the selected tile's markings. 
     */
    function updateMarkupButton() {
        if (markupMode) {
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

    /**
     * Moves the selector to the new index. 
     * @param {int} index The new index to be selected
     */
    function selectTile(index) {
        if (buttons[index].classList.contains("game-button") || markupButton.classList.contains('pressed')) {
            selected = index;
            buttons[selected].classList.toggle('selected');
            buttons[lastSelected].classList.toggle('selected');
            
            // Remove old highlights
            if (adjustIndex(lastSelected) == -1) {
                // Highlight row
                for (let i = lastSelected-5; i < lastSelected; i++) {
                    buttons[i].classList.remove("highlight");
                }
            } else if (adjustIndex(lastSelected) == -2) {
                // Highlight column
                for (let i = lastSelected % 6; i < lastSelected; i += 6) {
                    buttons[i].classList.remove("highlight");
                }
            }
            // Add highlights
            if (adjustIndex(selected) == -1) {
                // Highlight row
                for (let i = selected-5; i < selected; i++) {
                    buttons[i].classList.add("highlight");
                }
            } else if (adjustIndex(selected) == -2) {
                // Highlight column
                for (let i = selected % 6; i < selected; i += 6) {
                    buttons[i].classList.add("highlight");
                }
            }

            lastSelected = selected;
            updateMarkupButton();
        }
    }
    /**
     * Flips the tile at the selected index. Flipping updates the score, win/lose condition, etc. 
     * @param {int} index The tile to flip
     */
    function flipTile(index) {
        let button = buttons[index];
        // Prevent if not a game tile
        // If lock zeroes enabled, prevent if flagged
        // Prevent if in markup mode
        // Prevent if already flipped
        // Prevent if Voltorb image (for when game done)
        if (button.classList.contains("game-button") && !(button.classList.contains('flagged') && lockZeroes) && !markupMode && !button.classList.contains('pressed')) {
            
            revealSquare(index);

            if (gameState != 'win' && gameState != 'lose') {
                // Update the content of the html with the score
                tilesFlipped++;
                score *= tiles[adjustIndex(index)];
                document.getElementById('score-value').textContent = score;
                
                // check if win or lose
                if (score >= levelData[3]) {
                    gameState = 'win';
                    updateResetButton();
                    winPopup();
                } else if (score == 0) {
                    gameState = 'lose';
                    updateResetButton();
                    losePopup();
                    revealBombs();
                }
                
                // Check for safe rows (if enabled)
                if (autoClearSafeRows) {
                    let row = Math.floor(index / 6);
                    let column = index % 6;
                    if (rowBombs[row] == 0) {
                        for (let i = row*6; i < row*6+6; i++) {
                            if (!buttons[i].classList.contains('pressed')) {
                                flipTile(i);
                            }
                        }
                    }
                    if (columnBombs[column] == 0) {
                        for (let i = column; i < 35; i += 6) {
                            if (!buttons[i].classList.contains('pressed')) {
                                flipTile(i);
                            }
                        }
                    }
                }

            }
        }
    }
    /**
     * Reveals the bomb squares. 
     */
    function revealBombs() {
        for (let i = 0; i < 29; i++) {
            if (i % 5 == 0) i++; // skip row summary tiles
            if (tiles[adjustIndex(i)] == 0) {
                revealSquare(i);
            }
        }
    }
    /**
     * Reveals all unflipped tiles. 
     */
    function revealAll() {
        for (let i = 0; i < 35; i++) {
            revealSquare(i);
        }
    }
    /**
     * Reveals the tile at the selected tile. Revealing only flips it visually, and does not update anything. 
     * @param {int} index The tile to reveal
     */
    function revealSquare(index) {
        let button = buttons[index];
        // If a valid game tile
        // and if not flipped yet
        if (button.classList.contains("game-button") && !button.classList.contains('pressed')) {
            button.classList.add('pressed');
            button.disabled = true;
            button.style.transform = button.style.transform === 'rotateY(180deg)' ? 'rotateY(0deg)' : 'rotateY(180deg)';
        }
    }
  
    /**
     * Ends the current match, if at least one tile if flipped. Updates scores, performs animations, etc, then calls refreshGame.
     */
    function endMatch() {
        if (tilesFlipped <= 0) return; 
        // Reset Animation
        for (let i = 0; i < 35; i++) {
            let button = buttons[i];
            if (button.classList.contains('pressed')) {
                const tileFace = button.querySelector('.game-square-front');
                tileFace.innerHTML = '';
                button.style.transform = button.style.transform === 'rotateY(180deg)' ? 'rotateY(0deg)' : 'rotateY(180deg)';
            }
        }
        // Wait for after animation
        setTimeout(() => {
            
            // win or losing
            if (score == levelData[3]) { // win
                if (level < 8) level++;
            } else if (score == 0) { // loss
                level = Math.min(tilesFlipped-2, level);
                if (level < 0) level = 0;
            }
            totalScore += score;
            rounds++;
            refreshGame();
            // Update the content of the html with the score and stuff
            updateResetButton();
            document.getElementById('score-value').textContent = 0;
            document.getElementById('total-score-value').textContent = totalScore;
            document.getElementById('level-value').textContent = level+1;
            document.getElementById('round-value').textContent = rounds;
        }, 550);
    }

    /**
     * Shows the win popup.
     */
    function winPopup() {
        document.getElementById('popup-score-value').textContent = score;
        document.getElementById('win-popup').style.display = 'block';
    }
    /**
     * Shows the lose popup.
     */
    function losePopup() {
        document.getElementById('lose-message').innerText = loseMessages[getRandomInt(0, loseMessages.length-1)];
        document.getElementById('lose-popup').style.display = 'block';
    }
    
    /**
     * Closes any popups. 
     */
    function closePopup() {
        document.getElementById('win-popup').style.display = 'none';
        document.getElementById('lose-popup').style.display = 'none';
        revealAll();
    }

    /**
     * WIP. Supposed to maybe shake elements? 
     * @param {*} element 
     */
    function shakeElement(element) {
        element.classList.add('shake');
        setTimeout(() => {
          element.classList.remove('shake');
        }, 1000); // Adjust the duration of the shake
      }
  
    
  });
  
document.addEventListener('DOMContentLoaded', () => {
  const mainScreen = document.getElementById('mainScreen');
  const secondScreen = document.getElementById('secondScreen');
  const goalInput = document.getElementById('goalInput');
  const goalDate = document.getElementById('goalDate');
  const goalTime = document.getElementById('goalTime');
  const addGoalBtn = document.getElementById('addGoalBtn');
  const errorMessage = document.getElementById('errorMessage');
  const goalDropdown = document.getElementById('goalDropdown');
  const selectedGoalHeading = document.getElementById('selectedGoalHeading');
  const timeRemainingElement = document.getElementById('timeRemaining');
  const motivationalMessage = document.getElementById('motivationalMessage');
  const editGoalBtn = document.getElementById('editGoalBtn');
  const deleteGoalBtn = document.getElementById('deleteGoalBtn');
  const addTaskIcon = document.getElementById('addTaskIcon');
  const mainTitle = document.getElementById('mainTitle');

  let goals = JSON.parse(localStorage.getItem('goals')) || [];
  let countdownInterval = null; // Changed from object to single variable
  let isEditing = false;
  let editingIndex = null;

  /**
   * Switches to the second screen (Goals Overview).
   */
  function switchToSecondScreen() {
    mainScreen.style.display = 'none';
    secondScreen.style.display = 'block';
    populateDropdown();
    updateSelectedGoal();
  }
  function initializeDateInput() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    goalDate.setAttribute('min', todayStr);
  }

  /**
   * Adjusts the minimum time if the selected date is today.
   */
  function adjustTimeInput() {
    const selectedDate = goalDate.value;
    const today = new Date();
    const selected = new Date(selectedDate);

    if (
      selected.getFullYear() === today.getFullYear() &&
      selected.getMonth() === today.getMonth() &&
      selected.getDate() === today.getDate()
    ) {
      const hours = String(today.getHours()).padStart(2, '0');
      const minutes = String(today.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}`;
      goalTime.setAttribute('min', currentTimeStr);
    } else {
      goalTime.removeAttribute('min');
    }
  }

  // Initialize the date input on page load
  initializeDateInput();

  // Adjust time input whenever the date changes
  goalDate.addEventListener('change', adjustTimeInput);

  /**
   * Switches to the main screen (Add/Edit Goal).
   * @param {boolean} shouldReset - Determines whether to reset the form.
   */
  function switchToMainScreen(shouldReset = true) {
    secondScreen.style.display = 'none';
    mainScreen.style.display = 'block';
    if (shouldReset) {
      resetForm();
    }
  }

  /**
   * Validates the input fields.
   * @returns {boolean} - Returns true if inputs are valid, else false.
   */
  function validateInput() {
    const goal = goalInput.value.trim();
    const date = goalDate.value;
    const time = goalTime.value;

    if (!goal || !date || !time) {
      errorMessage.textContent = 'Please enter a goal, date, and time.';
      return false;
    }

    // Ensure the selected date and time are in the future
    const selectedDateTime = new Date(`${date}T${time}`).getTime();
    if (selectedDateTime <= Date.now()) {
      errorMessage.textContent = 'Please select a future date and time.';
      return false;
    }

    errorMessage.textContent = '';
    return true;
  }

  /**
   * Adds a new goal or updates an existing one.
   */
  function addGoal() {
    if (!validateInput()) return;

    const goalName = goalInput.value.trim();
    const goalDateTime = new Date(
      `${goalDate.value}T${goalTime.value}`
    ).getTime();

    if (isEditing) {
      // **Update `startTime` to current time when editing**
      goals[editingIndex] = {
        name: goalName,
        time: goalDateTime,
        startTime: Date.now(), // Reset startTime to current time
      };
      addGoalBtn.textContent = 'Add Goal'; // Reset button back to "Add Goal" after saving changes
      mainTitle.textContent = 'Add your goal and set a reminder'; // Reset title
      isEditing = false;
      editingIndex = null;
    } else {
      goals.push({
        name: goalName,
        time: goalDateTime,
        startTime: Date.now(), // Set startTime to current time
      });
    }

    localStorage.setItem('goals', JSON.stringify(goals));
    switchToSecondScreen();
  }

  /**
   * Populates the goal dropdown with existing goals.
   */
  function populateDropdown() {
    goalDropdown.innerHTML = '';
    goals.forEach((goal, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${index + 1}. ${goal.name}`; // Add numbers to the goal title
      goalDropdown.appendChild(option);
    });
    goalDropdown.value = goals.length - 1;
  }

  /**
   * Converts a string to title case.
   * @param {string} str - The string to convert.
   * @returns {string} - The title-cased string.
   */
  function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  /**
   * Updates the selected goal's display and countdown.
   */
  function updateSelectedGoal() {
    // Clear existing countdown interval
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    const selectedIndex = parseInt(goalDropdown.value, 10);
    const selectedGoal = goals[selectedIndex];

    // Use the toTitleCase function to convert the goal name to title case
    selectedGoalHeading.textContent = toTitleCase(selectedGoal.name);

    updateCountdown(selectedGoal.time, selectedGoal.startTime);
  }

  /**
   * Updates the countdown timer and background color based on remaining time.
   * @param {number} targetTime - The target time in milliseconds.
   * @param {number} startTime - The start time in milliseconds.
   */
  function updateCountdown(targetTime, startTime) {
    // Clear any existing interval
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    countdownInterval = setInterval(() => {
      const now = Date.now(); // Current time in milliseconds
      const totalTime = targetTime - startTime; // Total duration from start to target
      const timeRemaining = targetTime - now; // Time left until target

      // If time is up
      if (timeRemaining <= 0) {
        clearInterval(countdownInterval);
        timeRemainingElement.textContent = 'Time’s up! 😊';
        motivationalMessage.textContent = 'Hope you achieved your goal! 🥳';
        timeRemainingElement.style.backgroundColor = '#f44336'; // Red
        return;
      }

      // Calculate percentage of time remaining
      const percentRemaining = timeRemaining / totalTime;

      // Debugging
      console.log(
        'Total Time:',
        totalTime,
        'Time Remaining:',
        timeRemaining,
        'Percent Remaining:',
        percentRemaining
      );

      // Convert timeRemaining to days, hours, minutes, seconds
      const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor(
        (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

      // Update the countdown display
      timeRemainingElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      // Apply background color based on percentage remaining
      if (percentRemaining > 0.8) {
        timeRemainingElement.style.backgroundColor = '#4caf50'; // Green
        motivationalMessage.textContent = 'Keep going, you’re doing great!';
      } else if (percentRemaining > 0.6) {
        timeRemainingElement.style.backgroundColor = '#8bc34a'; // Light Green
        motivationalMessage.textContent = 'You’re making good progress!';
      } else if (percentRemaining > 0.4) {
        timeRemainingElement.style.backgroundColor = '#ffc107'; // Yellow
        motivationalMessage.textContent = 'Halfway there, stay focused!';
      } else if (percentRemaining > 0.2) {
        timeRemainingElement.style.backgroundColor = '#ff9800'; // Orange
        motivationalMessage.textContent = 'Keep pushing, you’re almost there!';
      } else {
        timeRemainingElement.style.backgroundColor = '#f44336'; // Red
        motivationalMessage.textContent = 'Hurry up! You can do it!';
      }
    }, 1000); // Update every second
  }

  /**
   * Deletes the selected goal after confirmation and updates the UI accordingly.
   */
  function deleteGoal() {
    const selectedIndex = parseInt(goalDropdown.value, 10);

    // Confirm deletion
    const confirmDelete = confirm(
      `Are you sure you want to delete the goal: "${goals[selectedIndex].name}"?`
    );
    if (!confirmDelete) return;

    // Remove the goal from the array
    goals.splice(selectedIndex, 1);
    localStorage.setItem('goals', JSON.stringify(goals));

    if (goals.length > 0) {
      // Repopulate the dropdown
      populateDropdown();

      // Determine the new selected index
      let newSelectedIndex = selectedIndex;

      // If the deleted goal was the last in the list, select the new last goal
      if (newSelectedIndex >= goals.length) {
        newSelectedIndex = goals.length - 1;
      }

      // Set the dropdown to the new selected index
      goalDropdown.value = newSelectedIndex;

      // Update the displayed goal
      updateSelectedGoal();
    } else {
      // If no goals are left, switch to the main screen
      switchToMainScreen();
    }
  }

  /**
   * Initiates the editing process for the selected goal.
   */
  function editGoal() {
    const selectedIndex = goalDropdown.value;
    const selectedGoal = goals[selectedIndex];

    goalInput.value = selectedGoal.name;
    const date = new Date(selectedGoal.time);
    goalDate.value = date.toISOString().split('T')[0];
    goalTime.value = date.toTimeString().split(':', 2).join(':');

    addGoalBtn.textContent = 'Make Changes'; // Change button text to "Make Changes"
    mainTitle.textContent = 'Edit your goal'; // Change the main screen title to "Edit your goal"
    isEditing = true;
    editingIndex = selectedIndex;

    // Switch to main screen without resetting the form
    switchToMainScreen(false);
  }

  /**
   * Resets the input form fields and error message.
   */
  function resetForm() {
    goalInput.value = '';
    goalDate.value = '';
    goalTime.value = '';
    errorMessage.textContent = '';
  }

  // Event Listeners
  addGoalBtn.addEventListener('click', addGoal);
  goalDropdown.addEventListener('change', updateSelectedGoal);
  deleteGoalBtn.addEventListener('click', deleteGoal);
  editGoalBtn.addEventListener('click', editGoal);
  addTaskIcon.addEventListener('click', () => switchToMainScreen());

  // Initialize the app by showing the appropriate screen
  if (goals.length > 0) {
    switchToSecondScreen();
  }
});

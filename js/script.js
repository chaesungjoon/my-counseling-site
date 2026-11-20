/* ==========================================================
   script.js - Mindful Path Counseling
   Shared JavaScript for every page.

   This one file is loaded on all five pages. Each feature first
   checks whether its HTML exists on the current page, and only
   runs if it does. That way, code for the Resources page doesn't
   cause errors on the homepage.

   Features
   1. Dark/light mode toggle            (every page)
   2. "Request with this counselor"     (Counselors -> Resources)
   3. Appointment form validation       (Resources page)
   4. Guided breathing exercise         (Resources page)
   ========================================================== */


/* ----------------------------------------------------------
   1. DARK/LIGHT MODE TOGGLE
   Adds or removes the "dark-mode" class on the <html> element.
   style.css swaps the color variables when that class is there.
   The choice is saved in localStorage so it carries over to
   every page and to the next visit.
   ---------------------------------------------------------- */

// The name used to save the choice in the browser's storage
const THEME_STORAGE_KEY = 'mindful-path-theme';

// The moon/sun button in the header (null if a page doesn't have it)
const themeToggle = document.querySelector('#theme-toggle');

// Turns dark mode on (true) or off (false) and updates the button
function setDarkMode(isDark) {
  // classList.toggle(name, force) adds the class if force is true, removes it if false
  document.documentElement.classList.toggle('dark-mode', isDark);

  if (themeToggle) {
    // aria-pressed tells screen readers whether dark mode is on
    themeToggle.setAttribute('aria-pressed', String(isDark));
    // Show a sun in dark mode (click for light) and a moon in light mode (click for dark)
    themeToggle.querySelector('.theme-icon').textContent = isDark ? '☀️' : '🌙';
  }
}

// Reads the saved choice. try/catch is used because some browsers block storage.
function getSavedTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);   // "dark", "light", or null
  } catch (error) {
    return null;
  }
}

// Saves the choice (ignored if storage is blocked)
function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    // Storage unavailable: the toggle still works, it just won't be remembered
  }
}

// When the page loads: use the saved choice, or if there isn't one,
// follow the device's own dark mode setting
const savedTheme = getSavedTheme();
const devicePrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
setDarkMode(savedTheme ? savedTheme === 'dark' : devicePrefersDark);

// When the button is clicked: flip the mode and save it
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDarkNow = document.documentElement.classList.contains('dark-mode');
    setDarkMode(!isDarkNow);
    saveTheme(!isDarkNow ? 'dark' : 'light');
  });
}


/* ----------------------------------------------------------
   2. "REQUEST WITH THIS COUNSELOR"
   The buttons on the Counselors page link to an address like
   resources.html?counselor=Maya%20Bennett#appointment
   This code reads the name after "?counselor=" and selects
   that counselor in the form's dropdown.
   ---------------------------------------------------------- */
const counselorSelect = document.querySelector('#counselor');

if (counselorSelect) {
  // URLSearchParams reads the "?name=value" part of the page address
  const params = new URLSearchParams(window.location.search);
  const requestedCounselor = params.get('counselor');   // e.g. "Maya Bennett", or null

  if (requestedCounselor) {
    // Only select it if the dropdown really has that option
    // (setting an unknown value would leave the dropdown blank)
    const matchingOption = Array.from(counselorSelect.options).find(
      (option) => option.value === requestedCounselor
    );
    if (matchingOption) {
      counselorSelect.value = matchingOption.value;
    }
  }
}


/* ----------------------------------------------------------
   3. APPOINTMENT FORM VALIDATION
   When "Send Request" is clicked, every field is checked.
   - Problems: a message appears under each field that needs
     fixing, and the cursor moves to the first one.
   - All good: the form clears and a thank-you message appears
     instead of the page reloading.
   The form has the "novalidate" attribute so the browser's
   built-in pop-up bubbles don't appear; this code shows its own.
   ---------------------------------------------------------- */
const appointmentForm = document.querySelector('#appointment-form');

if (appointmentForm) {
  // Grab each part of the form once, so the code below can reuse them
  const formStatus = document.querySelector('#form-status');
  const nameInput = document.querySelector('#full-name');
  const emailInput = document.querySelector('#email');
  const phoneInput = document.querySelector('#phone');
  const serviceSelect = document.querySelector('#service');
  const agreeCheckbox = document.querySelector('#demo-ack');
  const contactRadios = appointmentForm.querySelectorAll('input[name="contact-method"]');

  // Email pattern: some text, an @, more text, a dot, more text, and no spaces
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Shows an error message under a field
  function showError(field, message) {
    const group = field.closest('.form-group');            // the box around this field
    let error = group.querySelector('.error-message');

    // Create the message element the first time it's needed
    if (!error) {
      error = document.createElement('p');
      error.className = 'error-message';
      error.id = field.id + '-error';
      group.appendChild(error);
    }

    error.textContent = message;
    field.setAttribute('aria-invalid', 'true');            // marks the field as having a problem (also styled red in CSS)
    field.setAttribute('aria-describedby', error.id);      // screen readers read the message with the field
  }

  // Removes a field's error message
  function clearError(field) {
    const error = field.closest('.form-group').querySelector('.error-message');
    if (error) {
      error.remove();
    }
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
  }

  // --- One check per field. Each returns true if the field is OK. ---

  function checkName() {
    // trim() removes spaces at the start and end, so "   " counts as empty
    if (nameInput.value.trim().length < 2) {
      showError(nameInput, 'Please enter your full name.');
      return false;
    }
    clearError(nameInput);
    return true;
  }

  function checkEmail() {
    const email = emailInput.value.trim();
    if (email === '') {
      showError(emailInput, 'Please enter your email address.');
      return false;
    }
    if (!EMAIL_PATTERN.test(email)) {
      showError(emailInput, 'Please enter a valid email, like name@example.com.');
      return false;
    }
    clearError(emailInput);
    return true;
  }

  function checkPhone() {
    // Keep only the digits, so "(555) 123-4567" and "555.123.4567" both work
    const digits = phoneInput.value.replace(/\D/g, '');
    const checkedRadio = appointmentForm.querySelector('input[name="contact-method"]:checked');
    const wantsPhoneCall = checkedRadio !== null && checkedRadio.value === 'phone';

    // Phone is optional, unless "phone" was chosen as the contact method
    if (digits === '' && wantsPhoneCall) {
      showError(phoneInput, 'Please enter a phone number, or choose email as your contact method.');
      return false;
    }
    // If a number was typed, it must have exactly 10 digits
    if (digits !== '' && digits.length !== 10) {
      showError(phoneInput, 'Please enter a 10-digit phone number, like 555-123-4567.');
      return false;
    }
    clearError(phoneInput);
    return true;
  }

  function checkService() {
    // The first option ("Choose a service") has an empty value
    if (serviceSelect.value === '') {
      showError(serviceSelect, 'Please choose a service.');
      return false;
    }
    clearError(serviceSelect);
    return true;
  }

  function checkAgreement() {
    if (!agreeCheckbox.checked) {
      showError(agreeCheckbox, 'Please check this box to continue.');
      return false;
    }
    clearError(agreeCheckbox);
    return true;
  }

  // --- When the form is submitted ---
  appointmentForm.addEventListener('submit', (event) => {
    // Stop the browser from reloading the page
    event.preventDefault();

    // Run every check (instead of stopping at the first problem)
    // so all the errors show at the same time
    const results = [checkName(), checkEmail(), checkPhone(), checkService(), checkAgreement()];
    const allValid = !results.includes(false);

    if (!allValid) {
      formStatus.textContent = 'Please fix the highlighted fields and try again.';
      formStatus.className = 'form-status error';
      // Move the cursor to the first field with a problem
      appointmentForm.querySelector('[aria-invalid="true"]').focus();
      return;
    }

    // Everything is valid: save the details for the message, then clear the form
    const name = nameInput.value.trim();
    const service = serviceSelect.value;
    appointmentForm.reset();

    // textContent (not innerHTML) is used so typed text is shown as plain text, never as code
    formStatus.textContent = `Thank you, ${name}! Your request for ${service} was received. ` +
      '(This is a demo, so nothing was actually sent.)';
    formStatus.className = 'form-status success';
  });

  // --- Remove an error as soon as the field is fixed ---
  const fieldChecks = [
    { field: nameInput, check: checkName },
    { field: emailInput, check: checkEmail },
    { field: phoneInput, check: checkPhone },
    { field: serviceSelect, check: checkService },
    { field: agreeCheckbox, check: checkAgreement }
  ];

  fieldChecks.forEach(({ field, check }) => {
    // "input" fires on every keystroke, dropdown choice, or checkbox click
    field.addEventListener('input', () => {
      // Only re-check fields that are currently showing an error
      if (field.getAttribute('aria-invalid') === 'true') {
        check();
      }
    });
  });

  // Switching between email and phone can fix (or cause) the phone error
  contactRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (phoneInput.getAttribute('aria-invalid') === 'true') {
        checkPhone();
      }
    });
  });
}


/* ----------------------------------------------------------
   4. GUIDED BREATHING EXERCISE (box breathing)
   Four steps, 4 seconds each: breathe in, hold, breathe out, hold.
   Each step adds a class to the circle; style.css makes the
   circle grow or shrink over 4 seconds. A timer counts down
   every second and moves to the next step at zero.
   ---------------------------------------------------------- */
const breathingCircle = document.querySelector('#breathing-circle');

if (breathingCircle) {
  const breathingText = document.querySelector('#breathing-text');
  const breathingCount = document.querySelector('#breathing-count');
  const breathingRounds = document.querySelector('#breathing-rounds');
  const startButton = document.querySelector('#breathing-start');
  const stopButton = document.querySelector('#breathing-stop');

  // The four steps, in order. cssClass matches a rule in style.css.
  const BREATHING_STEPS = [
    { label: 'Breathe in', cssClass: 'inhale' },
    { label: 'Hold', cssClass: 'hold-full' },
    { label: 'Breathe out', cssClass: 'exhale' },
    { label: 'Hold', cssClass: 'hold-empty' }
  ];
  const SECONDS_PER_STEP = 4;

  let stepIndex = 0;                     // which step we're on (0 to 3)
  let secondsLeft = SECONDS_PER_STEP;    // countdown for the current step
  let roundsCompleted = 0;               // full cycles finished
  let timerId = null;                    // the running timer, so it can be stopped

  // Updates the circle and text for the current step
  function showStep() {
    const step = BREATHING_STEPS[stepIndex];
    breathingCircle.className = 'breathing-circle ' + step.cssClass;
    breathingText.textContent = step.label;
    breathingCount.textContent = secondsLeft;
  }

  // Runs once per second while the exercise is going
  function tick() {
    secondsLeft = secondsLeft - 1;

    if (secondsLeft > 0) {
      breathingCount.textContent = secondsLeft;   // just update the number
      return;
    }

    // This step is finished: move to the next one
    // (% wraps 3 back around to 0, so the steps repeat)
    stepIndex = (stepIndex + 1) % BREATHING_STEPS.length;
    secondsLeft = SECONDS_PER_STEP;

    // Back at step 0 means one full round just finished
    if (stepIndex === 0) {
      roundsCompleted = roundsCompleted + 1;
      breathingRounds.textContent = `Rounds completed: ${roundsCompleted}`;
    }

    showStep();
  }

  function startBreathing() {
    stepIndex = 0;
    secondsLeft = SECONDS_PER_STEP;
    roundsCompleted = 0;
    breathingRounds.textContent = 'Rounds completed: 0';
    showStep();
    timerId = setInterval(tick, 1000);   // call tick() every 1000 ms (1 second)

    startButton.disabled = true;          // can't start twice
    stopButton.disabled = false;
    stopButton.focus();                   // keyboard users can stop right away
  }

  function stopBreathing() {
    clearInterval(timerId);               // stop the timer
    timerId = null;

    breathingCircle.className = 'breathing-circle';   // back to normal size
    breathingText.textContent = 'Ready';
    breathingCount.textContent = '';

    startButton.disabled = false;
    stopButton.disabled = true;
    startButton.focus();                  // the Stop button is now disabled, so move focus
  }

  startButton.addEventListener('click', startBreathing);
  stopButton.addEventListener('click', stopBreathing);
}
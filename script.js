'use strict';

// prettier-ignore

///Constants//

let map, mapEvent;
//Creating class for workout i.e is parent class
class Workout {
  date = new Date(); //It creates the date
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  //these are declared in the constructor because they are intiated when the object of that class is created
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}
//creating running class which is base class
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  //calcPace function is used to calculate the pace of the person
  calcPace() {
    //mins/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
//creating cycling class which is base class
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  //calcSpeed function is used to calculate speed
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run = new Running([34, 56], 245, 1000, 23);
// console.log(run);

/////////////////////////////////////////////
//----APPLICATION ARCHITECTURE----//

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
//App class which consists of all the functionalities
class App {
  //These are declared in the app scope as private fields
  #map;
  #mapEvent;
  #workots = [];

  constructor() {
    this._getposition();
    //Get data from local storage
    this._getLocalStorage();
    //Event listener on form
    form.addEventListener('submit', this._newWorkout.bind(this));
    //it is used to change the form between cycling and running
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  //////FUNCTIONS/////
  //Function used to get the position and has a _loadMap function if loaction is founded.
  _getposition() {
    //If browser supports the navigator or not we are using the if statement

    if (navigator.geolocation)
      //using geolocation api to get the current location coordinates and It also asks the permissiom to enable the location
      //we use bind here because this keyword in the navigator has nothing and to get the this properties from loadmap we use bind
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  //Function used to load map by tiles and it is passed to navigator
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    const coords = [latitude, longitude];
    //Getting the leaflet library and creating map variable using map object
    this.#map = L.map('map').setView(coords, 13);
    //Tilelayer is the object used to load and display tile layers of map
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    //To handle the clicks on map we use the on function on map object which takes the parameters as the event triggered and callback function
    //we pass the _showForm as the callback but as it is a normal function this keyword is manually set by using bind keyword
    this.#map.on('click', this._showForm.bind(this));
    this.#workots.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }
  //Function to show map
  _showForm(mapE) {
    //assigning event name to local variable to avoid the error.
    this.#mapEvent = mapE;
    //when click is happened we need form to appear so we remove the hidden class from form
    form.classList.remove('hidden');
    //focus is used to focus the element when the form is created
    inputDistance.focus();
  }

  _hideForm() {
    //empty the inputs
    inputDuration.value =
      inputCadence.value =
      inputDistance.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  //It is the function used to toggle the form according to the type
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    //get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    //check if data is valid

    //If workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs should be positive finite numbers');
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //If workout cycling, create cycling object
    if (type == 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs should be positive finite numbers');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //Add new object to workout array
    this.#workots.push(workout);
    console.log(workout);

    //Render workout on map as marker
    this._renderWorkoutMarker(workout);

    //clear input fields//
    this._hideForm();
    //Render workout on list
    this._renderWorkout(workout);

    //Set local storage to all workouts
    this._setLocalStorage();

    //marker is the function used to create the marker on map
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
         <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">
            ${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `;
    if (workout.type === 'running') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>`;
    }
    if (workout.type === 'cycling') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const workOutEl = e.target.closest('.workout');
    if (!workOutEl) return;
    const workout = this.#workots.find(
      work => work.id === workOutEl.dataset.id
    );

    this.#map.setView(workout.coords, 13),
      {
        animate: true,
        pan: {
          duration: 1,
        },
      };
    // workout.click();
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workots));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workots = data;

    this.#workots.forEach(work => {
      this._renderWorkout(work);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();

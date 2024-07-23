class Draggable {
  constructor(element, callback) {
    this.element = element;
    this.isDragging = false;
    this.currentX = 0;

    this.callback = callback;

    this.init();
  }

  init() {
    this.element.addEventListener('mousedown', this.#handleMouseDown.bind(this));
    window.addEventListener('mousemove', this.#handleMouseMove.bind(this));
    window.addEventListener('mouseup', this.#handleMouseUp.bind(this));
  }


  #handleMouseDown(event) {
    this.isDragging = true;
    event.preventDefault();
  }

  #handleMouseMove(event) {
    if (!this.isDragging) return;
    const { width } = this.element.getBoundingClientRect();
    this.currentX = event.pageX - width; // Magic 🙃
    requestAnimationFrame(this.updatePosition.bind(this));
  }

  #handleMouseUp() {
    this.isDragging = false;
  }

  updatePosition() {
    const parentElement = this.element.parentElement;
    const { width } = parentElement.getBoundingClientRect();

    const locationPercent = (this.currentX / width) * 100;

    this.element.style.setProperty('--jj-sildy-button-left', `${locationPercent}%`);

    this.callback(locationPercent);
  }
}

class Slidy {

  /**
   *
   * @param containerSelector {null|string}
   * @param options {{
   *  min?: number,
   *  max?: number,
   *  step?: number,
   *  segmentsCount?: number,
   *  defaultValue?: number[]
   *  }|undefined}
   */
  constructor(containerSelector = null, options = {}) {
    if (!containerSelector) {
      throw new Error('Slidy: containerSelector is required');
    }
    if (options.defaultValue !== undefined && !Array.isArray(options.defaultValue) || options.defaultValue?.length < 1 || options.defaultValue?.length > 2) {
      throw new Error('Slidy: defaultValue must be an array of length 1 or 2');
    }

    if (options.min !== undefined && options.max !== undefined && options.min >= options.max) {
      throw new Error('Slidy: min must be less than max');
    }

    if (options.segmentsCount !== undefined && options.segmentsCount < 2) {
      throw new Error('Slidy: segmentsCount must be greater than 2');
    }


    this.container = document.querySelector(containerSelector);
    this.options = {
      min: options.min || 0,
      max: options.max || 100,
      step: options.step || 1,
      segmentsCount: options.segmentsCount,
      ...options,
    };

    this.values = options.defaultValue || [0];
    this.#init();
  }

  #createInputContainer() {
    const container = document.createElement('div');
    container.classList.add('slidy__input-container');
    return container;
  }

  #createInput(isMax = false) {
    // Create the input element
    const input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.classList.add('slidy__input');
    input.setAttribute('inputmode', 'numeric');

    input.addEventListener('input', (e) => {
      const newValue = e.target.value.replace(/[^0-9]/g, '');
      if (isMax) {
        this.#updateMax(newValue);
      } else {
        this.#updateMin(newValue);
      }
    });
    return input;
  }

  #createTrackContainer() {
    const trackContainer = document.createElement('div');
    trackContainer.classList.add('slidy__track-container');
    return trackContainer;
  }

  #createButton(isMax = false) {
    const button = document.createElement('button');
    button.classList.add('slidy__button');

    button.addEventListener('keydown', (e) => {

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowLeft':
          e.preventDefault();
          if (isMax) {
            this.#updateMax(this.values[1] - this.options.step);
          } else {
            this.#updateMin(this.values[0] - this.options.step);
          }
          break;
        case 'ArrowUp':
        case 'ArrowRight':
          e.preventDefault();
          if (isMax) {
            this.#updateMax(this.values[1] + this.options.step);
          } else {
            this.#updateMin(this.values[0] + this.options.step);
          }
          break;
      }
    });

    new Draggable(button, (currentPercentage) => {
      const newValue = Math.round(this.options.min + ((this.options.max - this.options.min) * (currentPercentage / 100)));
      if (isMax) {
        this.#updateMax(newValue);
      } else {
        this.#updateMin(newValue);
      }
    });


    return button;
  }

  #createTrack() {
    const track = document.createElement('div');
    track.classList.add('slidy__track');

    return track;
  }

  #createSegment() {
    const segment = document.createElement('button');
    segment.classList.add('slidy__segment');
    return segment;
  }

  #createSegmentContainer() {
    const segmentContainer = document.createElement('div');
    segmentContainer.classList.add('slidy__segment-container');
    return segmentContainer;
  }

  #init() {
    this.inputContainer = this.#createInputContainer();
    this.minInput = this.#createInput();
    this.inputContainer.appendChild(this.minInput);

    if (this.values.length === 2) {
      this.maxInput = this.#createInput();
      this.inputContainer.appendChild(this.maxInput);
    }

    this.trackContainer = this.#createTrackContainer();
    this.track = this.#createTrack();
    this.trackContainer.appendChild(this.track);

    this.minButton = this.#createButton();
    this.track.appendChild(this.minButton);

    if (this.values.length === 2) {
      this.maxButton = this.#createButton(true);
      this.track.appendChild(this.maxButton);
    }

    this.container.appendChild(this.inputContainer);
    this.container.appendChild(this.trackContainer);

    if (this.options.segmentsCount) {
      const segmentContainer = this.#createSegmentContainer();
      this.container.appendChild(segmentContainer);

      for (let i = this.options.min; i <= this.options.max; i += (this.options.max - this.options.min) / (this.options.segmentsCount - 1)) {
        const segment = this.#createSegment();

        segment.addEventListener('click', (e) => {
          e.preventDefault();
          // Less than the max
          if (this.values.length === 2) {
            if (i < this.values[1]) {
              this.#updateMin(i);
            } else {
              this.#updateMax(i);
            }
          } else {
            this.#updateMin(i);
          }
        });

        segmentContainer.appendChild(segment);
      }
    }


    this.container.classList.add('slidy');

    this.updateValues(this.values);
  }

  /**
   * @param newValue {number}
   */
  #updateMin(newValue) {
    this.values[0] = newValue;
    this.updateValues(this.values);
  }

  /**
   * @param newValue {number}
   */
  #updateMax(newValue) {
    if (this.values.length !== 2) {
      return;
    }
    this.values[1] = newValue;
    this.updateValues(this.values);
  }

  /**
   * @param values {number[]}
   */
  updateValues(values) {
    this.values = values.map((val) => this.#normalizeMinMax(val));

    if (this.values.length === 2 && this.values[0] > this.values[1]) {
      const temp = this.values.shift();
      this.values.push(temp);
    }

    this.minInput.value = this.values[0];
    if (this.values.length === 2) {
      this.maxInput.value = this.values[1];
    }

    this.#updateTrack();
  }

  #updateTrack() {
    const minPercent = ((this.values[0] - this.options.min) / (this.options.max - this.options.min)) * 100;

    this.minButton.style.setProperty('--jj-sildy-button-left', `${minPercent}%`);
    this.track.style.setProperty('--jj-sildy-track-min-left', `0%`);
    this.track.style.setProperty('--jj-sildy-track-max-left', `${minPercent}%`);

    if (this.values.length === 2) {
      const max = this.values[1];
      const maxPercent = ((max - this.options.min) / (this.options.max - this.options.min)) * 100;
      this.maxButton.style.setProperty('--jj-sildy-button-left', `${maxPercent}%`);
      this.track.style.setProperty('--jj-sildy-track-min-left', `${minPercent}%`);
      this.track.style.setProperty('--jj-sildy-track-max-left', `${maxPercent}%`);
    }
  }

  #normalizeMinMax(value) {
    if (value < this.options.min) {
      return this.options.min;
    }
    if (value > this.options.max) {
      return this.options.max;
    }
    return value % this.options.step === 0 ? value : Math.round(value / this.options.step) * this.options.step;
  };
}

new Slidy('#slidy_0', { defaultValue: [50], min: 0, max: 100, step: 5 });
new Slidy('#slidy_1', { defaultValue: [50], min: 0, max: 300, segmentsCount: 10 });
new Slidy('#slidy_2', { defaultValue: [50, 80], min: 0, max: 250 });
new Slidy('#slidy_3', { defaultValue: [20, 270], min: 0, max: 300, segmentsCount: 10 });

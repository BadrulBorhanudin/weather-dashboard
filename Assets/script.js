$(document).ready(function () {

    // OpenWeather API Key
    const apiKey = "535965135d8bb40fad0c7fa2d640519a";

    // Selectors for HTML elements to display weather information
    const cityEl = $('h2#city');
    const dateEl = $('h3#date');
    const weatherIconEl = $('img#weather-icon');
    const temperatureEl = $('span#temperature');
    const humidityEl = $('span#humidity');
    const windEl = $('span#wind');
    const cityListEl = $('div.cityList');

    // Selectors for form elements
    const cityInput = $('#city-input');

    // Store past searched cities
    let pastCities = [];

    // Helper function to sort cities from https://www.sitepoint.com/sort-an-array-of-objects-in-javascript/
    function compare(a, b) {
        const cityA = a.city.toUpperCase();
        const cityB = b.city.toUpperCase();
        let comparison = 0;
        if (cityA > cityB) {
            comparison = 1;
        } else if (cityA < cityB) {
            comparison = -1;
        }
        return comparison;
    }

    // Local storage functions for past searched cities

    // Load events from local storage
    function loadCities() {
        const storedCities = JSON.parse(localStorage.getItem('pastCities'));
        if (storedCities) {
            pastCities = storedCities;
        }
    }

    // Store searched cities in local storage
    function storeCities() {
        localStorage.setItem('pastCities', JSON.stringify(pastCities));
    }

    // Functions to build the URL for the OpenWeather API call

    function buildURLFromInputs(city) {
        if (city) {
            return `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
        }
    }

    function buildURLFromId(id) {
        return `https://api.openweathermap.org/data/2.5/weather?id=${id}&appid=${apiKey}`;
    }

    // Function to display the last 5 searched cities
    function displayCities(pastCities) {
        cityListEl.empty();
        pastCities.splice(5);
        let sortedCities = [...pastCities];
        sortedCities.sort(compare);
        sortedCities.forEach(function (location) {
            let cityDiv = $('<div>').addClass('col-12 city');
            let cityBtn = $('<button>').addClass('btn btn-light city-btn').text(location.city);
            cityDiv.append(cityBtn);
            cityListEl.append(cityDiv);
        });
    }

    // Search for weather conditions by calling the OpenWeather API
    async function searchWeather(queryURL) {
        try {
            // Create a fetch call to retrieve weather data
            const response = await fetch(queryURL);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const responseData = await response.json();

            // Store current city in past cities
            let city = responseData.name;
            let id = responseData.id;
            // Remove duplicate cities
            if (pastCities[0]) {
                pastCities = pastCities.filter(storedCity => id !== storedCity.id);
            }
            pastCities.unshift({ city, id });
            storeCities();
            displayCities(pastCities);

            // Display current weather in DOM elements
            cityEl.text(responseData.name);
            let formattedDate = dayjs.unix(responseData.dt).format('DD/MM/YYYY');
            dateEl.text(formattedDate);
            let weatherIcon = responseData.weather[0].icon;
            weatherIconEl.attr('src', `http://openweathermap.org/img/wn/${weatherIcon}.png`).attr('alt', responseData.weather[0].description);
            temperatureEl.html(((responseData.main.temp - 273.15)).toFixed(1));
            humidityEl.text(responseData.main.humidity);
            windEl.text((responseData.wind.speed * 1.60934).toFixed(1));

            // Call OpenWeather API forecast with lat and lon to get 5 day forecast
            let lat = responseData.coord.lat;
            let lon = responseData.coord.lon;
            let queryURLAll = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;
            const responseAll = await fetch(queryURLAll);
            if (!responseAll.ok) {
                throw new Error('Network response was not ok');
            }

            const responseAllData = await responseAll.json();

            // Display 5 day forecast in DOM elements
            for (let i = 0; i < 5; i++) {
                let currDay = responseAllData.list[i * 8]; // Using i * 8 to get data for each day
                $(`div.day-${i} .card-title`).text(dayjs.unix(currDay.dt).format('DD/MM/YYYY'));
                $(`div.day-${i} .fiveDay-img`).attr(
                    'src',
                    `http://openweathermap.org/img/wn/${currDay.weather[0].icon}.png`
                ).attr('alt', currDay.weather[0].description);
                $(`div.day-${i} .fiveDay-temp`).text(((currDay.main.temp - 273.15)).toFixed(1));
                $(`div.day-${i} .fiveDay-wind`).text((currDay.wind.speed).toFixed(1));
                $(`div.day-${i} .fiveDay-humid`).text(currDay.main.humidity);
                
            }

            } catch (error) {
                console.error('Error fetching weather data:', error);
            }
        }

    // Function to display the last searched city
    function displayLastSearchedCity() {
        if (pastCities[0]) {
            let queryURL = buildURLFromId(pastCities[0].id);
            searchWeather(queryURL);
        } else {
            // if no past searched cities, load Adelaide weather data
            let queryURL = buildURLFromInputs("Adelaide");
            searchWeather(queryURL);
        }
    }

    // Click handler for search button
    $('#search-btn').on('click', function (event) {
        // Preventing the button from trying to submit the form
        event.preventDefault();

        // Retrieving and scrubbing the city from the inputs
        let city = cityInput.val().trim();
        city = city.replace(' ', '%20');

        // Clear the input fields
        cityInput.val('');

        // Build the query url with the city and searchWeather
        if (city) {
            let queryURL = buildURLFromInputs(city);
            searchWeather(queryURL);
        }
    });

    // Click handler for city buttons to load that city's weather
    $(document).on("click", "button.city-btn", function () {
        let clickedCity = $(this).text();
        let foundCity = pastCities.find(storedCity => clickedCity === storedCity.city);
        let queryURL = buildURLFromId(foundCity.id);
        searchWeather(queryURL);
    });

    // Initialization - when page loads

    // load any cities in local storage into array
    loadCities();
    displayCities(pastCities);

    // Display weather for last searched city
    displayLastSearchedCity();
});

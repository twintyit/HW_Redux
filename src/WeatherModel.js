class DataFetcher {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseApiUrl = 'https://api.openweathermap.org/data/2.5';
    }

    async fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    async getDataByCoordinates(lat, lon) {
        const apiUrl = `${this.baseApiUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}`;
        return this.fetchData(apiUrl);
    }

    async getDataByCity(cityName) {
        const apiUrl = `${this.baseApiUrl}/forecast?q=${cityName}&appid=${this.apiKey}`;
        return this.fetchData(apiUrl);
    }

    async getNearbyCitiesByCoordinates(lat, lon, count = 5) {
        const apiUrl = `${this.baseApiUrl}/find?lat=${lat}&lon=${lon}&cnt=${count}&appid=${this.apiKey}`;
        return this.fetchData(apiUrl);
    }

    async getNearbyCitiesByCityName(cityName, count = 5) {
        try {
            const cityData = await this.getDataByCity(cityName);
            const lat = cityData.city.coord.lat;
            const lon = cityData.city.coord.lon;
            return this.getNearbyCitiesByCoordinates(lat, lon, count);
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }
}

class Geolocation {
    async getPosition() {
        return new Promise((resolve, reject) => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        });
                    },
                    (error) => {
                        reject(`Ошибка получения местоположения: ${error.message}`);
                    }
                );
            } else {
                reject("Geolocation не поддерживается вашим браузером");
            }
        });
    }
}

class ParseHelper {
    kelvinToCelsius(kelvin) {
        return Math.round(kelvin - 273.15);
    }

    parseTimestamp(value) {
        let date = new Date(value * 1000);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return { hours, minutes };
    }

    parseTimeTo12(hours, minutes, period) {
        if (!period)
            period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        minutes < 10 ? minutes = `0${minutes}` : minutes;
        return { hours, minutes, period };
    }

    getHoursTo12(value) {
        let hours = value.split(/[ :]/).slice(1, 2);
        const period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return { hours, period };
    }

    degreesToDirection(degrees) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const normalizedDegrees = (degrees % 360 + 360) % 360;
        const index = Math.round(normalizedDegrees / 45) % 8;

        return directions[index];
    }

    convertWind(metersPerSecond, deg) {
        const speed = parseInt(metersPerSecond * 3.6);
        const degrees = this.degreesToDirection(deg);
        return `${speed} ${degrees} `;
    }

    parseTimeString(date) {
        let hour = date.split(/[ :]/).slice(1, 2);
        const { hours, minutes, period } = this.parseTimeTo12(hour, 0);

        return `${hours}:00 ${period}`;
    }
}

class WeatherModel {
    ph = new ParseHelper();
    geo = new Geolocation();
    data;
    dataNearbyCities;

    constructor(apiKey) {
        this.df = new DataFetcher(apiKey);
    }

    async setData(cityName) {
        try {
            if (cityName) {
                this.data = await this.df.getDataByCity(cityName);
            }
            else {
                const { lat, lon } = await this.geo.getPosition();
                this.data = await this.df.getDataByCoordinates(lat, lon);
            }
            await this.groupDataByDay();
        } catch (error) {
            throw error;
        }
    }

    async setDataForNearbyCities(cityName) {
        try {
            this.dataNearbyCities = await this.df.getNearbyCitiesByCityName(cityName);
        } catch (error) {
            throw error;
        }
    }

    groupDataByDay() {
        const groupedData = {};

        for (const item of this.data.list) {
            const date = new Date(item.dt * 1000);
            const day = date.toDateString();

            if (!groupedData[day]) {
                groupedData[day] = [];
            }
            groupedData[day].push(item);
        }

        const dataWithDayOfWeek = this.dataWithDayOfWeek(Object.values(groupedData));
        this.data.list = dataWithDayOfWeek;
    }

    dataWithDayOfWeek(data) {
        const dataWithDayOfWeek = data.map((dayData) => {
            const date = new Date(dayData[0].dt * 1000);
            const dayMonth = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' }).format(date);
            const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
            return { dayData, dayOfWeek, dayMonth };
        });

        return dataWithDayOfWeek;
    }

    getCurrentLocation() {
        const city = this.data.city.name;
        const country = this.data.city.country;
        return { city, country };
    }

    getDataForFiveDay(index) {
        return {
            dayOfWeek: this.data.list[index].dayOfWeek,
            dayMonth: this.data.list[index].dayMonth,
            iconKey: this.data.list[index].dayData[0].weather[0].main,
            temp: this.ph.kelvinToCelsius(this.data.list[index].dayData[0].main.temp),
            info: this.data.list[index].dayData[0].weather[0].main
        }
    }

    getDataForHourly(indexDay, index) {
        if (this.data.list[indexDay].dayData.length <= index) {
            index -= this.data.list[indexDay].dayData.length;
            indexDay++;
        }
        const degrees = this.data.list[indexDay].dayData[index].wind.deg;
        const speed = this.data.list[indexDay].dayData[index].wind.speed;

        return {
            time: this.ph.parseTimeString(this.data.list[indexDay].dayData[index].dt_txt),
            iconKey: this.data.list[indexDay].dayData[index].weather[0].main,
            forecast: this.data.list[indexDay].dayData[index].weather[0].main,
            temp: this.ph.kelvinToCelsius(this.data.list[indexDay].dayData[index].main.temp),
            realFeet: this.ph.kelvinToCelsius(this.data.list[indexDay].dayData[index].main.feels_like),
            wind: this.ph.convertWind(speed, degrees)
        }
    }

    getDataForCurrentWeather() {
        let sunrise = this.ph.parseTimestamp(this.data.city.sunrise);
        sunrise = this.ph.parseTimeTo12(sunrise.hours, sunrise.minutes);

        let sunset = this.ph.parseTimestamp(this.data.city.sunset);
        sunset = this.ph.parseTimeTo12(sunset.hours, sunset.minutes);

        let duration = this.calculateDuration();

        return {
            forecast: this.data.list[0].dayData[0].weather[0].main,
            temp: this.ph.kelvinToCelsius(this.data.list[0].dayData[0].main.temp),
            realFeet: this.ph.kelvinToCelsius(this.data.list[0].dayData[0].main.feels_like),
            sunrise: `${sunrise.hours}:${sunrise.minutes} ${sunrise.period}`,
            sunset: `${sunset.hours}:${sunset.minutes} ${sunset.period}`,
            duration: `${duration.hours}:${duration.minutes} hr`
        }
    }

    calculateDuration() {
        const duration = this.data.city.sunset - this.data.city.sunrise;
        let { hours, minutes } = this.ph.parseTimestamp(duration);
        return this.ph.parseTimeTo12(hours, minutes, 'hr');
    }

    getDataForNearbyCities(index) {
        return {
            city: this.dataNearbyCities.list[index].name,
            iconKey: this.dataNearbyCities.list[index].weather[0].main,
            temp: this.ph.kelvinToCelsius(this.dataNearbyCities.list[index].main.temp)
        }
    }

    getCurrentTime() {
        const currentDate = new Date();
        let currentHour = currentDate.getHours();
        const currentMinute = currentDate.getMinutes();
        let amOrPm = 'am';

        if (currentHour >= 12) {
            currentHour -= 12;
            amOrPm = 'pm';
        }

        if (currentHour === 0) {
            currentHour = 12;
        }

        const formattedHour = currentHour.toString().padStart(2, '0');
        const formattedMinute = currentMinute.toString().padStart(2, '0');

        return `${formattedHour}:${formattedMinute} ${amOrPm}`;
    }
}

export default WeatherModel;
import React, { useEffect, useRef, useState } from "react";
import WeatherModel from "../WeatherModel";
import Cookies from "js-cookie";
import { useDispatch, useSelector } from 'react-redux';
import { setWeather, setHourlyData, setCurrentIcon } from '../redux/weatherActions';
import { icons } from "../icons";

const Weather = () => {
    const dispatch = useDispatch();
    const weatherState = useSelector(state => state.weather);

    const apiKey = 'bc991eae9e5342cd91b7b05d917f97f7';
    const wm = new WeatherModel(apiKey);
    const searchInput = useRef();

    const setWeatherData = async (city) => {
        await wm.setData(city);
        dispatch(setWeather(wm.getDataForCurrentWeather()));
        dispatch(setCurrentIcon(getIcon(wm.getCurrentTime())));
        dispatch(setHourlyData(getHourlyData()));
        setPlaceholderInSearchInp();
        Cookies.set('favoriteCity', city, { expires: 7 });
    };

    useEffect(() => {
        const loadWeatherData = async () => {
            const favoriteCity = Cookies.get('favoriteCity');
            await setWeatherData(favoriteCity);
        };
        loadWeatherData();
    }, []);

    useEffect(() => {
        console.log(wm.data);
        if (weatherState.currentWeather.sunrise, weatherState.currentWeather.sunset) {
            dispatch(setCurrentIcon(getIcon(wm.getCurrentTime())));
            // dispatch(setHourlyData(getHourlyData()));
        }
    }, [weatherState.currentWeather.sunrise, weatherState.currentWeather.sunset])

    const getHourlyData = () => {
        let tempHourlyData = [];
        for (let i = 0; i < 6; i++) {
            const { time, iconKey, forecast, temp, realFeet, wind } = wm.getDataForHourly(0, i);
            const icon = getIcon(time);
            tempHourlyData.push({ time, iconKey, forecast, temp, realFeet, wind, icon });
        }
        return tempHourlyData;
    };

    const setPlaceholderInSearchInp = () => {
        const location = wm.getCurrentLocation();
        searchInput.current.placeholder = location.city;
    };

    const getIcon = (time) => {
        console.log(weatherState.currentWeather.sunrise);
        if (weatherState.currentWeather.sunrise, weatherState.currentWeather.sunset) {
            const current = parseTime(time);
            const sunrise = parseTime(weatherState.currentWeather.sunrise);
            const sunset = parseTime(weatherState.currentWeather.sunset);

            if (current.format === sunrise.format) {
                if (current.hours === 12) {
                    return icons.get('moon');
                } else if (current.hours >= sunrise.hours) {
                    if (current.hours === sunrise.hours) {
                        if (current.minutes < sunrise.minutes) {
                            return icons.get('sun');
                        } else {
                            return icons.get('moon');
                        }
                    } else {
                        return icons.get('sun');
                    }
                } else {
                    return icons.get('moon');
                }
            } else if (current.format === sunset.format) {
                if (current.hours === 12) {
                    return icons.get('sun');
                } else if (current.hours >= sunset.hours) {
                    if (current.hours === sunset.hours) {
                        if (current.minutes > sunset.minutes) {
                            return icons.get('moon');
                        } else {
                            return icons.get('sun');
                        }
                    } else {
                        return icons.get('moon');
                    }
                } else {
                    return icons.get('sun');
                }
            }
        }
    };

    const parseTime = (timeString) => {
        const regex = /^(\d+):(\d+)\s*([APMapm]{2})$/;
        const match = timeString.match(regex);

        if (match) {
            const hours = parseInt(match[1], 10);
            const minutes = parseInt(match[2], 10);
            const format = match[3].toLowerCase();

            return { hours, minutes, format };
        } else {
            console.log('Неправильный формат времени.');
        }
    };

    const search = async () => {
        setWeatherData(searchInput.current.value);
        searchInput.current.value = '';
    };

    return (
        <div className="main">
            <div className="top">
                <h2 className="header">MY WEATHER</h2>
                <label >
                    <input className="search-input" type="text" ref={searchInput} />
                    <div id="searchButton" onClick={search}>
                        <img className="magnifying-glass" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLza2p3w0w6WwlMnMaoMyTcrrpA-_9-hAB1-rah1LoFFb7JpfR9GpLS7FwXYzdqZ37FmQ&usqp=CAU" alt="" />
                    </div>
                </label>
            </div>
            <div className="today-conteiner">
                <div className="current-weather-conteiner">
                    <div className="current-weather-top">
                        <h4 className="header">CURRENT WEATHER</h4>
                        <h4 className="header"></h4>
                    </div>
                    <div className="current-weather">
                        <div className="icon-conteiner">
                            <img className="weather-icon" src={weatherState.currentIcon} />
                        </div>
                        <div className="temperature-conteiner">
                            <p className="temperature">{weatherState.currentWeather.temp}<span id="temperature"></span>°C</p>
                            <p>Real Feet <span id="realFeet">{weatherState.currentWeather.realFeet}</span>°C</p>
                        </div>
                        <div className="more-info-conteiner">
                            <p>Sunrise:</p>
                            <p>{weatherState.currentWeather.sunrise}</p>
                            <p>Sunset:</p>
                            <p>{weatherState.currentWeather.sunset}</p>
                            <p>Duration:</p>
                            <p>{weatherState.currentWeather.duration}</p>
                        </div>
                    </div>
                </div>

                <div className="hourly-conteiner">
                    <h4 className="header">HOURLY</h4>
                    <div id="hourlyBlock" className="hourly">
                        <div className="hourly-elem">
                            <h4 className="current-day">TODAY</h4>
                            <img className="weather-icon" src="" alt="" />
                            <p>Forecast</p>
                            <p>Temp(°C)</p>
                            <p>Real Feel</p>
                            <p>Wind(km/h)</p>
                        </div>
                        {weatherState.hourlyData && weatherState.hourlyData.map((item, index) => (
                            <div className="hourly-elem" key={index}>
                                <p>{item.time}</p>
                                <img src={item.icon} className="weather-icon" alt="" />
                                <p>{item.forecast}</p>
                                <p>{item.temp}°C</p>
                                <p>{item.realFeel}°C</p>
                                <p>{item.wind}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="nearby-places-conteiner">
                    <h4 className="header">NEARBY PLACES</h4>
                    <div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default Weather;
export const SET_WEATHER = 'SET_WEATHER';
export const SET_HOURLY_DATA = 'SET_HOURLY_DATA';
export const SET_CURRENT_ICON = 'SET_CURRENT_ICON';

export const setWeather = (weather) => ({ type: SET_WEATHER, payload: weather });
export const setHourlyData = (hourlyData) => ({ type: SET_HOURLY_DATA, payload: hourlyData });
export const setCurrentIcon = (icon) => ({ type: SET_CURRENT_ICON, payload: icon });
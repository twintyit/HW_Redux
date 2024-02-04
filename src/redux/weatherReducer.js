import { SET_WEATHER, SET_HOURLY_DATA, SET_CURRENT_ICON } from '../redux/weatherActions';

const initialState = {
    currentWeather: {},
    hourlyData: [],
    currentIcon: '',
};

const weatherReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_WEATHER:
            return {
                ...state,
                currentWeather: action.payload,
            };
        case SET_HOURLY_DATA:
            return {
                ...state,
                hourlyData: action.payload,
            };
        case SET_CURRENT_ICON:
            return {
                ...state,
                currentIcon: action.payload,
            };
        default:
            return state;
    }
};

export default weatherReducer;
import { createStore, combineReducers } from 'redux';
import weatherReducer from './weatherReducer'

const rootReducer = combineReducers({
    weather: weatherReducer,
});

const store = createStore(rootReducer);

export default store;
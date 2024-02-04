import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

const Counter = () => {
  const dispatch = useDispatch();
  const count = useSelector(state => state.count);

  const increment = () => {
    dispatch({ type: 'INCREMENT' });
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
};

export default Counter;
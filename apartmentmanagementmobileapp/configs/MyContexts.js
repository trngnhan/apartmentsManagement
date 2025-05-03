import React, { createContext, useReducer } from 'react';
import MyUserReducer from '../reducers/MyUserReducer';


// Initial state
const initialState = {
    user: null,
};

// Create the context
export const MyStateContext = createContext(initialState);
export const MyDispatchContext = createContext(null);

// Provider Component
export const MyProvider = ({ children }) => {
    const [state, dispatch] = useReducer(MyUserReducer, initialState);

    return (
        <MyStateContext.Provider value={state}>
            <MyDispatchContext.Provider value={dispatch}>
                {children}
            </MyDispatchContext.Provider>
        </MyStateContext.Provider>
    );
};
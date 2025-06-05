import React, { createContext, useReducer } from 'react';
import MyUserReducer from '../reducers/MyUserReducer';

const initialState = {
    user: null,
};
export const MyStateContext = createContext(initialState);
export const MyDispatchContext = createContext(null);

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
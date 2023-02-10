import React from "react";

export type UseStateT<T> = [T, React.Dispatch<React.SetStateAction<T>>];
export type UseReducerT<S, A> = [S, React.Dispatch<A>];

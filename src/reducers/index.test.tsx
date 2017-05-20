import {enthusiasm} from "./index";
import {StoreState} from "../types/index";
import {decrementEnthusiasm, incrementEnthusiasm} from "../actions/index";

describe('the enthusiasm reducer', () => {
    it('changes the state on increment', () => {
        const oldState: StoreState = {
            languageName: "typescript",
            enthusiasmLevel: 1
        };
        const newState = enthusiasm(oldState, incrementEnthusiasm());
        expect(oldState).not.toEqual(newState);
    });

    it('keeps the state on decrement', () => {
        const oldState: StoreState = {
            languageName: "typescript",
            enthusiasmLevel: 1
        };
        const newState = enthusiasm(oldState, decrementEnthusiasm());
        expect(oldState).toEqual(newState);
    });

    it('increments the state by one on increment', () => {
        const oldState: StoreState = {
            languageName: "typescript",
            enthusiasmLevel: 1
        };
        const newState = enthusiasm(oldState, incrementEnthusiasm());
        expect(newState.enthusiasmLevel).toEqual(oldState.enthusiasmLevel + 1);
    });

    it('decrements the state by one on decrement', () => {
        const oldState: StoreState = {
            languageName: "typescript",
            enthusiasmLevel: 2
        };
        const newState = enthusiasm(oldState, decrementEnthusiasm());
        expect(newState.enthusiasmLevel).toEqual(oldState.enthusiasmLevel - 1);
    });
});
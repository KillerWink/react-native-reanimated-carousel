import React, { useState, useEffect, useContext } from 'react';
import Animated, { Easing } from 'react-native-reanimated';

const {
    Value,
    cond,
    set,
    block,
    clockRunning,
    startClock,
    timing,
    stopClock,
    call,
} = Animated;

const runTiming = (clock, value, dest, duration, currentIndex) => {

    const state = {
        finished: new Value(0),
        position: new Value(0),
        time: new Value(0),
        frameTime: new Value(0),
    };

    const config = {
        duration: duration,
        toValue: new Value(0),
        easing: Easing.elastic(1),
    };

    return block([
        cond(clockRunning(clock), 0, [
            set(state.finished, 0),
            set(state.time, 0),
            set(state.position, value),
            set(state.frameTime, 0),
            set(config.toValue, dest),
            startClock(clock),
        ]),
        timing(clock, state, config),
        cond(state.finished, block([stopClock(clock)])),
        state.position,
    ]);
};

export default runTiming;

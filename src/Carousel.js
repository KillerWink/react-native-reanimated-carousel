import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Animated from 'react-native-reanimated';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { CarouselContainer } from './Carousel.style';
import { DEFAULT_PROPS_CAROUSEL } from './config';
import runTiming from './timing';
import { CarouselContext } from './CarouselContext';

const {
    event,
    Value,
    cond,
    eq,
    or,
    set,
    add,
    greaterOrEq,
    greaterThan,
    multiply,
    abs,
    sub,
    block,
    lessOrEq,
    Clock
} = Animated;



class Carousel extends Component {

    static contextType = CarouselContext;
    constructor(props) {
        super(props);

        this.dragX = new Value(0);
        this.offsetX = new Value(0);
        this.gestureState = new Value(-1);
        this.currentIndex = new Value(0);
        this.totalItems = new Value(React.Children.count(this.props.children));
        this.velocity = new Value(0);

        this.onPanGestureEvent = event(
            [{ nativeEvent: {
                velocityX: this.velocity,
                state: this.gestureState,
                translationX: this.dragX
            } }]
        );

        this.setSlideContext = (slide) => {
            const { setActiveSlide } = this.context;
            setActiveSlide(slide[0]);
        };

        const setIndexLeft = cond(
            lessOrEq(this.currentIndex, 0),
            set(this.currentIndex, 0),
            set(this.currentIndex, sub(this.currentIndex, 1)),
        );
        const setIndexRight = cond(
            greaterOrEq(this.currentIndex, sub(this.totalItems, 1)),
            set(this.currentIndex, sub(this.totalItems, 1)),
            set(this.currentIndex, add(this.currentIndex, 1)),
        );

        const goLeft = block([
            setIndexLeft,
            multiply(-this.props.width, this.currentIndex),
            set(this.offsetX, multiply(-this.props.width, this.currentIndex))
        ]);
        const goRight = block([
            setIndexRight,
            multiply(-this.props.width, this.currentIndex),
            set(this.offsetX, multiply(-this.props.width, this.currentIndex))
        ]);

        const goBackToStart = multiply(-this.props.width, this.currentIndex);

        const checkIfLeftOrRight = cond(
            greaterThan(this.dragX, 0),
            goLeft,
            goRight,
        );

        const checkIfActionNeeded =
            cond(
                eq(this.gestureState, State.END),
                cond(
                    or(
                        greaterOrEq(abs(this.dragX), this.props.panLimit),
                        greaterOrEq(abs(this.velocity), this.props.velocityLimit)
                    ),
                    checkIfLeftOrRight,
                    goBackToStart
                ),
                add(this.offsetX, this.dragX),
            );

        this.transX = cond(
            or(
                eq(this.gestureState, State.ACTIVE),
                eq(this.gestureState, State.BEGAN)
            ),
            add(this.offsetX, this.dragX),
            runTiming(
                new Clock(),
                add(this.offsetX, this.dragX),
                checkIfActionNeeded,
                this.props.duration,
                this.currentIndex,
                this.setSlideContext
            ),
        );

    }


    render(){
        return (
            <PanGestureHandler
                onGestureEvent={this.onPanGestureEvent}
                onHandlerStateChange={this.onPanGestureEvent}
            >
                <Animated.View style={{
                    width: this.props.width,
                }}>
                    <Animated.View style={{
                        transform: [{translateX: this.transX}],
                    }}>
                        <CarouselContainer height={this.props.height} width={this.props.width}>
                            {this.props.children}
                        </CarouselContainer>
                    </Animated.View>
                </Animated.View>
            </PanGestureHandler>
        );
    }
}

Carousel.defaultProps = {
    height: DEFAULT_PROPS_CAROUSEL.height,
    width: DEFAULT_PROPS_CAROUSEL.width,
    panLimit: DEFAULT_PROPS_CAROUSEL.panLimit,
    velocityLimit: DEFAULT_PROPS_CAROUSEL.velocityLimit,
    duration: DEFAULT_PROPS_CAROUSEL.duration,
};

Carousel.propTypes = {
    children: PropTypes.node,
    height: PropTypes.number,
    width: PropTypes.number,
    panLimit: PropTypes.number,
    velocityLimit: PropTypes.number,
    duration: PropTypes.number,
};

export default Carousel;

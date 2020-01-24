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
    block,
    lessOrEq,
    Clock,
    call,
    interpolate,
    round,
    divide,
} = Animated;

const currentWidth = new Value(0);
const dragX = new Value(0);
const offsetX = new Value(0);
const velocity = new Value(0);
const gestureState = new Value(-1);
let translationX = new Value(0);
let setIndex = new Value(0);

function getScrollBehaviour() {
    return cond(
        greaterThan(dragX, 0),
        divide(
            add(offsetX, dragX),
            round(interpolate(abs(velocity), {
                inputRange: [0, 2000],
                outputRange: [1, 2],
                extrapolate: 'clamp',
            })),
        ),
        multiply(
            add(offsetX, dragX),
            round(interpolate(abs(velocity), {
                inputRange: [0, 2000],
                outputRange: [1, 2],
                extrapolate: 'clamp',
            })),
        ),
    );
}

function setIndexFromWidthArray(cumulative, canScroll) {
    return block([
        ...cumulative.map((element, index) =>
            block([
                cond(
                    lessOrEq(
                        cond(
                            eq(canScroll, 1),
                            getScrollBehaviour(),
                            add(offsetX, dragX)
                        ),
                        element
                    ),
                    [set(setIndex, index), set(currentWidth, element)]
                )
            ]),
        )
    ]);
}


function goBackToStart(){
    return set(offsetX, currentWidth);
}

function checkIfFurtherActionNeeded(panLimit, velocityLimit){
    return cond(
            eq(gestureState, State.END),
            cond(
                or(
                    greaterOrEq(abs(dragX), panLimit),
                    greaterOrEq(abs(velocity), velocityLimit)
                ),
                set(offsetX, currentWidth),
                goBackToStart()
            ),
            add(offsetX, dragX),
        );
}


function setTranslationX(cumulative, panLimit, velocityLimit, duration, canScroll) {
    return translationX = cond(
        or(
            eq(gestureState, State.ACTIVE),
            eq(gestureState, State.BEGAN)
        ),
        [setIndexFromWidthArray(cumulative, canScroll), add(offsetX, dragX)],
        runTiming(
            new Clock(),
            add(offsetX, dragX),
            checkIfFurtherActionNeeded(panLimit, velocityLimit),
            duration,
        ),
    );
}


class Carousel extends Component {

    static contextType = CarouselContext;
    constructor(props) {
        super(props);
        this.state = {
            widthArrays: [],
            cumulative: false,
        };
        this.onLayout = this.onLayout.bind(this);
        this.addLayoutValues = this.addLayoutValues.bind(this);
        this.totalItems = new Value(React.Children.count(this.props.children));

        this.onPanGestureEvent = event(
            [{ nativeEvent: {
                velocityX: velocity,
                state: gestureState,
                translationX: dragX
            } }]
        );

        this.setSlideContext = (slide) => {
            const { setActiveSlide } = this.context;
            setActiveSlide(slide[0]);
        };

    }

    addLayoutValues = () => {
        let cumulative;
        cumulative = this.state.widthArrays.reduce(function(arr, val) {
            arr.push((arr.length && arr[arr.length - 1] || 0) + val);
            return val;
        }, []);
        this.setState({ cumulative });
        this.transX = setTranslationX(cumulative, this.props.panLimit, this.props.velocityLimit, this.props.duration);
    };

    onLayout = (event, index) => {
        this.setState({ widthArrays: [...this.state.widthArrays, event.nativeEvent.layout.width*-1 ] });
        if(index+1 === this.totalItems) {
            this.addLayoutValues();
        }
    };


    render(){
        return (
            <PanGestureHandler
                onGestureEvent={this.onPanGestureEvent}
                onHandlerStateChange={this.onPanGestureEvent}
            >
                <Animated.View style={{
                    width: this.props.width,
                }}>
                    <Animated.Code>
                        { () => call([setIndex], this.setSlideContext) }
                    </Animated.Code>
                    <Animated.View style={{
                        transform: [{translateX: this.state.cumulative ? this.transX : 0}],
                    }}>
                        <CarouselContainer height={this.props.height} width={this.props.width}>
                            { React.Children.map(this.props.children, (child, index) => (
                                <Animated.View onLayout={(event) => this.onLayout(event, index)}>
                                    {child}
                                </Animated.View>
                            ))}
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
